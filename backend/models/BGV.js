const pool = require('../config/database');

class BGV {
  // Create BGV record
  static async create(data) {
    const query = `
      INSERT INTO bgv (
        emp_id, photo, dob, aadhar_number, passport_number, emp_name,
        contact1, contact2, mail_id1, mail_id2,
        date_of_joining, designation, department, project,
        bgv_status, reason_for_reject, education
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17
      )
      RETURNING *
    `;
    
    const values = [
      data.empId, data.photo, data.dob, data.aadharNumber, data.passportNumber, data.empName,
      data.contact1, data.contact2, data.mailId1, data.mailId2,
      data.dateOfJoining, data.designation, data.department, data.project,
      data.bgvStatus, data.reasonForReject, data.education
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get all BGV records
  static async findAll() {
    const query = 'SELECT * FROM bgv ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  // Get BGV by emp_id
  static async findByEmpId(empId) {
    const query = 'SELECT * FROM bgv WHERE emp_id = $1';
    const result = await pool.query(query, [empId]);
    return result.rows[0];
  }

  // Get all BGV records by status
  static async findByStatus(status) {
    const query = `
      SELECT * FROM bgv 
      WHERE bgv_status = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [status]);
    return result.rows;
  }

  // Get pending BGV (no status or empty status)
  static async findPendingBGV() {
    const query = `
      SELECT * FROM bgv 
      WHERE bgv_status IS NULL OR bgv_status = '' 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Get failed BGV (Yellow or Red)
  static async findFailedBGV() {
    const query = `
      SELECT * FROM bgv 
      WHERE bgv_status IN ('Yellow', 'Red') 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Get BGV records by department
  static async findByDepartment(department) {
    const query = `
      SELECT * FROM bgv 
      WHERE department ILIKE $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [`%${department}%`]);
    return result.rows;
  }

  // Update BGV record
  static async update(empId, data) {
    const query = `
      UPDATE bgv SET
        photo = $1, dob = $2, aadhar_number = $3, passport_number = $4, emp_name = $5,
        contact1 = $6, contact2 = $7, mail_id1 = $8, mail_id2 = $9,
        date_of_joining = $10, designation = $11, department = $12, project = $13,
        bgv_status = $14, reason_for_reject = $15, education = $16,
        updated_at = CURRENT_TIMESTAMP
      WHERE emp_id = $17
      RETURNING *
    `;
    
    const values = [
      data.photo, data.dob, data.aadharNumber, data.passportNumber, data.empName,
      data.contact1, data.contact2, data.mailId1, data.mailId2,
      data.dateOfJoining, data.designation, data.department, data.project,
      data.bgvStatus, data.reasonForReject, data.education,
      empId
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update BGV status only
  static async updateStatus(empId, status, reason = null) {
    const query = `
      UPDATE bgv SET
        bgv_status = $1,
        reason_for_reject = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE emp_id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [status, reason, empId]);
    return result.rows[0];
  }

  // Delete BGV record
  static async delete(empId) {
    const query = 'DELETE FROM bgv WHERE emp_id = $1 RETURNING *';
    const result = await pool.query(query, [empId]);
    return result.rows[0];
  }

  // Get BGV statistics
  static async getStatistics() {
    const query = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(*) FILTER (WHERE bgv_status = 'Green') as green_count,
        COUNT(*) FILTER (WHERE bgv_status = 'Yellow') as yellow_count,
        COUNT(*) FILTER (WHERE bgv_status = 'Red') as red_count,
        COUNT(*) FILTER (WHERE bgv_status IS NULL OR bgv_status = '') as pending_count,
        ROUND(
          (COUNT(*) FILTER (WHERE bgv_status = 'Green')::DECIMAL / 
          NULLIF(COUNT(*), 0) * 100), 2
        ) as green_percentage
      FROM bgv
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }

  // Get BGV statistics by department
  static async getStatisticsByDepartment(department) {
    const query = `
      SELECT 
        department,
        COUNT(*) as total_records,
        COUNT(*) FILTER (WHERE bgv_status = 'Green') as green_count,
        COUNT(*) FILTER (WHERE bgv_status = 'Yellow') as yellow_count,
        COUNT(*) FILTER (WHERE bgv_status = 'Red') as red_count,
        COUNT(*) FILTER (WHERE bgv_status IS NULL OR bgv_status = '') as pending_count
      FROM bgv
      WHERE department = $1
      GROUP BY department
    `;
    const result = await pool.query(query, [department]);
    return result.rows[0];
  }

  // Get department-wise BGV summary
  static async getDepartmentWiseSummary() {
    const query = `
      SELECT 
        department,
        COUNT(*) as total_employees,
        COUNT(*) FILTER (WHERE bgv_status = 'Green') as cleared,
        COUNT(*) FILTER (WHERE bgv_status = 'Yellow') as concern,
        COUNT(*) FILTER (WHERE bgv_status = 'Red') as rejected,
        COUNT(*) FILTER (WHERE bgv_status IS NULL OR bgv_status = '') as pending
      FROM bgv
      WHERE department IS NOT NULL AND department != ''
      GROUP BY department
      ORDER BY total_employees DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Get employees with BGV issues
  static async getEmployeesWithIssues() {
    const query = `
      SELECT 
        emp_id, emp_name, designation, department, 
        bgv_status, reason_for_reject, date_of_joining
      FROM bgv 
      WHERE bgv_status IN ('Yellow', 'Red')
      ORDER BY 
        CASE bgv_status 
          WHEN 'Red' THEN 1 
          WHEN 'Yellow' THEN 2 
        END,
        date_of_joining DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = BGV;