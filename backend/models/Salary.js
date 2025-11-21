const pool = require('../config/database');

class Salary {
  // Create salary record
  static async create(data) {
    const query = `
      INSERT INTO salary (
        emp_id, photo, emp_name, designation, department_id, department_name,
        reporting_manager, project_name,
        basic_salary, hra, conveyance_allowance, medical_allowance,
        special_allowance, other_allowances, gross_salary,
        provident_fund, professional_tax, income_tax, other_deductions,
        total_deductions, net_salary,
        payment_mode, payment_date, salary_month, remarks
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25
      )
      RETURNING *
    `;
    
    const values = [
      data.empId, data.photo, data.empName, data.designation, data.departmentId, data.departmentName,
      data.reportingManager, data.projectName,
      data.basicSalary, data.hra, data.conveyanceAllowance, data.medicalAllowance,
      data.specialAllowance, data.otherAllowances, data.grossSalary,
      data.providentFund, data.professionalTax, data.incomeTax, data.otherDeductions,
      data.totalDeductions, data.netSalary,
      data.paymentMode, data.paymentDate, data.salaryMonth, data.remarks
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get all salary records
  static async findAll() {
    const query = 'SELECT * FROM salary ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  // Get salary by emp_id
  static async findByEmpId(empId) {
    const query = 'SELECT * FROM salary WHERE emp_id = $1';
    const result = await pool.query(query, [empId]);
    return result.rows[0];
  }

  // Get salary records by emp_id (for history)
  static async findAllByEmpId(empId) {
    const query = 'SELECT * FROM salary WHERE emp_id = $1 ORDER BY salary_month DESC';
    const result = await pool.query(query, [empId]);
    return result.rows;
  }

  // Get salary by month
  static async findByMonth(empId, month) {
    const query = 'SELECT * FROM salary WHERE emp_id = $1 AND salary_month = $2';
    const result = await pool.query(query, [empId, month]);
    return result.rows[0];
  }

  // Update salary
  static async update(empId, data) {
    const query = `
      UPDATE salary SET
        photo = $1, emp_name = $2, designation = $3, department_id = $4, department_name = $5,
        reporting_manager = $6, project_name = $7,
        basic_salary = $8, hra = $9, conveyance_allowance = $10, medical_allowance = $11,
        special_allowance = $12, other_allowances = $13, gross_salary = $14,
        provident_fund = $15, professional_tax = $16, income_tax = $17, other_deductions = $18,
        total_deductions = $19, net_salary = $20,
        payment_mode = $21, payment_date = $22, salary_month = $23, remarks = $24,
        updated_at = CURRENT_TIMESTAMP
      WHERE emp_id = $25
      RETURNING *
    `;
    
    const values = [
      data.photo, data.empName, data.designation, data.departmentId, data.departmentName,
      data.reportingManager, data.projectName,
      data.basicSalary, data.hra, data.conveyanceAllowance, data.medicalAllowance,
      data.specialAllowance, data.otherAllowances, data.grossSalary,
      data.providentFund, data.professionalTax, data.incomeTax, data.otherDeductions,
      data.totalDeductions, data.netSalary,
      data.paymentMode, data.paymentDate, data.salaryMonth, data.remarks,
      empId
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete salary
  static async delete(empId) {
    const query = 'DELETE FROM salary WHERE emp_id = $1 RETURNING *';
    const result = await pool.query(query, [empId]);
    return result.rows[0];
  }

  // Get salary statistics
  static async getStatistics(empId) {
    const query = `
      SELECT 
        COUNT(*) as total_months,
        SUM(gross_salary::numeric) as total_gross,
        SUM(net_salary::numeric) as total_net,
        AVG(gross_salary::numeric) as avg_gross,
        AVG(net_salary::numeric) as avg_net
      FROM salary 
      WHERE emp_id = $1
    `;
    const result = await pool.query(query, [empId]);
    return result.rows[0];
  }
}

module.exports = Salary;