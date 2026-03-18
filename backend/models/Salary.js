const pool = require('../config/database');

class Salary {
  // Create salary record
static async create(data) {
  const query = `
    INSERT INTO salary (
      emp_id, salary_month, basic_salary, hra, conveyance_allowance, medical_allowance,
      special_allowance, other_allowances, gross_salary,
      provident_fund, professional_tax, income_tax, total_deductions, net_salary,
      payment_mode, payment_date, remarks
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    RETURNING *
  `;
  const values = [
    data.empId,
    data.salaryMonth || null,
    parseFloat(data.basicSalary) || 0,
    parseFloat(data.hra) || 0,
    parseFloat(data.conveyanceAllowance) || 0,
    parseFloat(data.medicalAllowance) || 0,
    parseFloat(data.specialAllowance) || 0,
    parseFloat(data.otherAllowances) || 0,
    parseFloat(data.grossSalary) || 0,
    parseFloat(data.providentFund) || 0,
    parseFloat(data.professionalTax) || 0,
    parseFloat(data.incomeTax) || 0,
    parseFloat(data.totalDeductions) || 0,
    parseFloat(data.netSalary) || 0,
    data.paymentMode || null,
    data.paymentDate || null,
    data.remarks || null
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
      salary_month = $1, basic_salary = $2, hra = $3, conveyance_allowance = $4, medical_allowance = $5,
      special_allowance = $6, other_allowances = $7, gross_salary = $8,
      provident_fund = $9, professional_tax = $10, income_tax = $11, total_deductions = $12, net_salary = $13,
      payment_mode = $14, payment_date = $15, remarks = $16,
      updated_at = CURRENT_TIMESTAMP
    WHERE emp_id = $17
    RETURNING *
  `;
  const values = [
    data.salaryMonth || null,
    parseFloat(data.basicSalary) || 0,
    parseFloat(data.hra) || 0,
    parseFloat(data.conveyanceAllowance) || 0,
    parseFloat(data.medicalAllowance) || 0,
    parseFloat(data.specialAllowance) || 0,
    parseFloat(data.otherAllowances) || 0,
    parseFloat(data.grossSalary) || 0,
    parseFloat(data.providentFund) || 0,
    parseFloat(data.professionalTax) || 0,
    parseFloat(data.incomeTax) || 0,
    parseFloat(data.totalDeductions) || 0,
    parseFloat(data.netSalary) || 0,
    data.paymentMode || null,
    data.paymentDate || null,
    data.remarks || null,
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