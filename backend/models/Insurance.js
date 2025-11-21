const pool = require('../config/database');

class Insurance {
  // Create insurance record
  static async create(data) {
    const query = `
      INSERT INTO insurance (
        emp_id, photo, emp_name, designation, department_id, department_name,
        reporting_manager, project_name,
        insurance_provider, policy_number, policy_type, coverage_amount, premium_amount,
        policy_start_date, policy_end_date, policy_status,
        nominee_details, nominee_relation, nominee_contact_number,
        dependents_count, dependent_details, claim_history, remarks
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23
      )
      RETURNING *
    `;
    
    const values = [
      data.empId, data.photo, data.empName, data.designation, data.departmentId, data.departmentName,
      data.reportingManager, data.projectName,
      data.insuranceProvider, data.policyNumber, data.policyType, data.coverageAmount, data.premiumAmount,
      data.policyStartDate, data.policyEndDate, data.policyStatus,
      data.nomineeDetails, data.nomineeRelation, data.nomineeContactNumber,
      data.dependentsCount, data.dependentDetails, data.claimHistory, data.remarks
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get all insurance records
  static async findAll() {
    const query = 'SELECT * FROM insurance ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  // Get insurance by emp_id
  static async findByEmpId(empId) {
    const query = 'SELECT * FROM insurance WHERE emp_id = $1';
    const result = await pool.query(query, [empId]);
    return result.rows[0];
  }

  // Get all insurance records by emp_id (for history)
  static async findAllByEmpId(empId) {
    const query = 'SELECT * FROM insurance WHERE emp_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [empId]);
    return result.rows;
  }

  // Get insurance by policy number
  static async findByPolicyNumber(policyNumber) {
    const query = 'SELECT * FROM insurance WHERE policy_number = $1';
    const result = await pool.query(query, [policyNumber]);
    return result.rows[0];
  }

  // Get insurance by status
  static async findByStatus(status) {
    const query = `
      SELECT * FROM insurance 
      WHERE policy_status = $1 
      ORDER BY policy_end_date ASC
    `;
    const result = await pool.query(query, [status]);
    return result.rows;
  }

  // Get expiring policies (within days)
  static async findExpiringPolicies(days = 30) {
    const query = `
      SELECT * FROM insurance 
      WHERE policy_status = 'Active' 
      AND policy_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $1
      ORDER BY policy_end_date ASC
    `;
    const result = await pool.query(query, [days]);
    return result.rows;
  }

  // Get expired policies
  static async findExpiredPolicies() {
    const query = `
      SELECT * FROM insurance 
      WHERE policy_end_date < CURRENT_DATE 
      AND policy_status != 'Expired'
      ORDER BY policy_end_date DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Update insurance record
  static async update(empId, data) {
    const query = `
      UPDATE insurance SET
        photo = $1, emp_name = $2, designation = $3, department_id = $4, department_name = $5,
        reporting_manager = $6, project_name = $7,
        insurance_provider = $8, policy_number = $9, policy_type = $10, coverage_amount = $11, premium_amount = $12,
        policy_start_date = $13, policy_end_date = $14, policy_status = $15,
        nominee_details = $16, nominee_relation = $17, nominee_contact_number = $18,
        dependents_count = $19, dependent_details = $20, claim_history = $21, remarks = $22,
        updated_at = CURRENT_TIMESTAMP
      WHERE emp_id = $23
      RETURNING *
    `;
    
    const values = [
      data.photo, data.empName, data.designation, data.departmentId, data.departmentName,
      data.reportingManager, data.projectName,
      data.insuranceProvider, data.policyNumber, data.policyType, data.coverageAmount, data.premiumAmount,
      data.policyStartDate, data.policyEndDate, data.policyStatus,
      data.nomineeDetails, data.nomineeRelation, data.nomineeContactNumber,
      data.dependentsCount, data.dependentDetails, data.claimHistory, data.remarks,
      empId
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update policy status only
  static async updateStatus(empId, status) {
    const query = `
      UPDATE insurance SET
        policy_status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE emp_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, empId]);
    return result.rows[0];
  }

  // Delete insurance record
  static async delete(empId) {
    const query = 'DELETE FROM insurance WHERE emp_id = $1 RETURNING *';
    const result = await pool.query(query, [empId]);
    return result.rows[0];
  }

  // Get insurance summary
  static async getSummary(empId) {
    const query = `
      SELECT 
        emp_id, emp_name, insurance_provider, policy_number, policy_type,
        coverage_amount, premium_amount, policy_status,
        policy_start_date, policy_end_date,
        (policy_end_date - CURRENT_DATE) as days_remaining,
        nominee_details, dependents_count
      FROM insurance 
      WHERE emp_id = $1
    `;
    const result = await pool.query(query, [empId]);
    return result.rows[0];
  }

  // Get insurance statistics
  static async getStatistics() {
    const query = `
      SELECT 
        COUNT(*) as total_policies,
        COUNT(*) FILTER (WHERE policy_status = 'Active') as active_policies,
        COUNT(*) FILTER (WHERE policy_status = 'Expired') as expired_policies,
        COUNT(*) FILTER (WHERE policy_status = 'Pending') as pending_policies,
        COUNT(*) FILTER (WHERE policy_status = 'Cancelled') as cancelled_policies,
        SUM(coverage_amount::numeric) as total_coverage,
        SUM(premium_amount::numeric) as total_premiums,
        AVG(coverage_amount::numeric) as avg_coverage,
        AVG(premium_amount::numeric) as avg_premium
      FROM insurance
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }

  // Get policies expiring soon with employee details
  static async getExpiringPoliciesWithDetails(days = 30) {
    const query = `
      SELECT 
        emp_id, emp_name, designation, department_name,
        insurance_provider, policy_number, policy_type,
        policy_end_date,
        (policy_end_date - CURRENT_DATE) as days_remaining
      FROM insurance 
      WHERE policy_status = 'Active' 
      AND policy_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $1
      ORDER BY policy_end_date ASC
    `;
    const result = await pool.query(query, [days]);
    return result.rows;
  }
}

module.exports = Insurance;