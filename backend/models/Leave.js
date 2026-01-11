const pool = require('../config/database');

class Leave {
  // Create leave record
  static async create(data) {
    const query = `
      INSERT INTO leave_applications (
        emp_id, leave_type, from_date, to_date, reason, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6
      )
      RETURNING *
    `;
    
    const values = [
      data.empId,
      data.leaveApplyType,
      data.leaveFromDate,
      data.leaveToDate,
      data.reasonForLeave || null,
      data.leaveApprovalStatus || 'Pending'
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get all leave records
  static async findAll() {
    const query = `
      SELECT 
        la.*,
        ed.full_name,
        ed.designation,
        d.name as department
      FROM leave_applications la
      LEFT JOIN employee_details ed ON la.emp_id = ed.emp_id
      LEFT JOIN departments d ON ed.department_id = d.id
      ORDER BY la.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Get leave by emp_id
  static async findByEmpId(empId) {
    const query = `
      SELECT 
        la.*,
        ed.full_name,
        ed.designation,
        d.name as department
      FROM leave_applications la
      LEFT JOIN employee_details ed ON la.emp_id = ed.emp_id
      LEFT JOIN departments d ON ed.department_id = d.id
      WHERE la.emp_id = $1
      ORDER BY la.created_at DESC
    `;
    const result = await pool.query(query, [empId]);
    return result.rows;
  }

  // Get all leave records by emp_id (for history)
  static async findAllByEmpId(empId) {
    const query = `
      SELECT 
        la.*,
        ed.full_name,
        ed.designation,
        d.name as department
      FROM leave_applications la
      LEFT JOIN employee_details ed ON la.emp_id = ed.emp_id
      LEFT JOIN departments d ON ed.department_id = d.id
      WHERE la.emp_id = $1
      ORDER BY la.created_at DESC
    `;
    const result = await pool.query(query, [empId]);
    return result.rows;
  }

  // Get pending leave requests
  static async findPendingLeaves() {
    const query = `
      SELECT 
        la.*,
        ed.full_name,
        ed.designation,
        d.name as department
      FROM leave_applications la
      LEFT JOIN employee_details ed ON la.emp_id = ed.emp_id
      LEFT JOIN departments d ON ed.department_id = d.id
      WHERE la.status = 'Pending' 
      ORDER BY la.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Get leave requests by status
  static async findByStatus(status) {
    const query = `
      SELECT 
        la.*,
        ed.full_name,
        ed.designation,
        d.name as department
      FROM leave_applications la
      LEFT JOIN employee_details ed ON la.emp_id = ed.emp_id
      LEFT JOIN departments d ON ed.department_id = d.id
      WHERE la.status = $1 
      ORDER BY la.created_at DESC
    `;
    const result = await pool.query(query, [status]);
    return result.rows;
  }

  // Get leave requests by date range
  static async findByDateRange(empId, fromDate, toDate) {
    const query = `
      SELECT 
        la.*,
        ed.full_name,
        ed.designation,
        d.name as department
      FROM leave_applications la
      LEFT JOIN employee_details ed ON la.emp_id = ed.emp_id
      LEFT JOIN departments d ON ed.department_id = d.id
      WHERE la.emp_id = $1 
      AND la.from_date >= $2 
      AND la.to_date <= $3
      ORDER BY la.from_date DESC
    `;
    const result = await pool.query(query, [empId, fromDate, toDate]);
    return result.rows;
  }

  // Update leave record
  static async update(leaveId, data) {
    const query = `
      UPDATE leave_applications SET
        leave_type = $1,
        from_date = $2,
        to_date = $3,
        reason = $4,
        status = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;
    
    const values = [
      data.leaveApplyType || data.leave_type,
      data.leaveFromDate || data.from_date,
      data.leaveToDate || data.to_date,
      data.reasonForLeave || data.reason || null,
      data.leaveApprovalStatus || data.status || 'Pending',
      leaveId
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update leave status only
  static async updateStatus(leaveId, status) {
    const query = `
      UPDATE leave_applications SET
        status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, leaveId]);
    return result.rows[0];
  }

  // Delete leave record
  static async delete(leaveId) {
    const query = 'DELETE FROM leave_applications WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [leaveId]);
    return result.rows[0];
  }

  // Get leave balance summary
  static async getLeaveBalance(empId) {
    const query = `
      SELECT 
        emp_id,
        leave_type,
        allocated,
        consumed,
        remaining
      FROM leave_types
      WHERE emp_id = $1 AND year = EXTRACT(YEAR FROM CURRENT_DATE)
    `;
    const result = await pool.query(query, [empId]);
    return result.rows;
  }

  // Get leave statistics
  static async getLeaveStatistics(empId) {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'Approved') as total_approved,
        COUNT(*) FILTER (WHERE status = 'Pending') as total_pending,
        COUNT(*) FILTER (WHERE status = 'Rejected') as total_rejected,
        COUNT(*) as total_requests,
        SUM(
          CASE 
            WHEN from_date IS NOT NULL AND to_date IS NOT NULL 
            THEN (to_date - from_date + 1)
            ELSE 0 
          END
        ) FILTER (WHERE status = 'Approved') as total_days_taken
      FROM leave_applications 
      WHERE emp_id = $1
    `;
    const result = await pool.query(query, [empId]);
    return result.rows[0];
  }
}

module.exports = Leave;