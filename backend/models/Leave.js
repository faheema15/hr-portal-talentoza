const pool = require('../config/database');

class Leave {
  // Create leave record
  static async create(data) {
    const query = `
      INSERT INTO leave_management (
        emp_id, photo, emp_name, designation, department_id, department_name,
        reporting_manager, project_name,
        type_of_leave1, sick_leaves_allocated, sick_leaves_consumed, sick_leaves_remaining,
        type_of_leave2, rh_allocated, rh_consumed, rh_remaining,
        type_of_leave3, pl_allocated, pl_consumed, pl_remaining,
        leave_apply_type, leave_from_date, leave_to_date, reason_for_leave,
        approval_manager, skip_level_manager, leave_approval_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27
      )
      RETURNING *
    `;
    
    const values = [
      data.empId, data.photo, data.empName, data.designation, data.departmentId, data.departmentName,
      data.reportingManager, data.projectName,
      data.typeOfLeave1, data.sickLeavesAllocated, data.sickLeavesConsumed, data.sickLeavesRemaining,
      data.typeOfLeave2, data.rhAllocated, data.rhConsumed, data.rhRemaining,
      data.typeOfLeave3, data.plAllocated, data.plConsumed, data.plRemaining,
      data.leaveApplyType, data.leaveFromDate, data.leaveToDate, data.reasonForLeave,
      data.approvalManager, data.skipLevelManager, data.leaveApprovalStatus
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get all leave records
  static async findAll() {
    const query = 'SELECT * FROM leave_management ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  // Get leave by emp_id
  static async findByEmpId(empId) {
    const query = 'SELECT * FROM leave_management WHERE emp_id = $1';
    const result = await pool.query(query, [empId]);
    return result.rows[0];
  }

  // Get all leave records by emp_id (for history)
  static async findAllByEmpId(empId) {
    const query = 'SELECT * FROM leave_management WHERE emp_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [empId]);
    return result.rows;
  }

  // Get pending leave requests
  static async findPendingLeaves() {
    const query = `
      SELECT * FROM leave_management 
      WHERE leave_approval_status = 'Pending' 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Get leave requests by status
  static async findByStatus(status) {
    const query = `
      SELECT * FROM leave_management 
      WHERE leave_approval_status = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [status]);
    return result.rows;
  }

  // Get leave requests by date range
  static async findByDateRange(empId, fromDate, toDate) {
    const query = `
      SELECT * FROM leave_management 
      WHERE emp_id = $1 
      AND leave_from_date >= $2 
      AND leave_to_date <= $3
      ORDER BY leave_from_date DESC
    `;
    const result = await pool.query(query, [empId, fromDate, toDate]);
    return result.rows;
  }

  // Update leave record
  static async update(empId, data) {
    const query = `
      UPDATE leave_management SET
        photo = $1, emp_name = $2, designation = $3, department_id = $4, department_name = $5,
        reporting_manager = $6, project_name = $7,
        type_of_leave1 = $8, sick_leaves_allocated = $9, sick_leaves_consumed = $10, sick_leaves_remaining = $11,
        type_of_leave2 = $12, rh_allocated = $13, rh_consumed = $14, rh_remaining = $15,
        type_of_leave3 = $16, pl_allocated = $17, pl_consumed = $18, pl_remaining = $19,
        leave_apply_type = $20, leave_from_date = $21, leave_to_date = $22, reason_for_leave = $23,
        approval_manager = $24, skip_level_manager = $25, leave_approval_status = $26,
        updated_at = CURRENT_TIMESTAMP
      WHERE emp_id = $27
      RETURNING *
    `;
    
    const values = [
      data.photo, data.empName, data.designation, data.departmentId, data.departmentName,
      data.reportingManager, data.projectName,
      data.typeOfLeave1, data.sickLeavesAllocated, data.sickLeavesConsumed, data.sickLeavesRemaining,
      data.typeOfLeave2, data.rhAllocated, data.rhConsumed, data.rhRemaining,
      data.typeOfLeave3, data.plAllocated, data.plConsumed, data.plRemaining,
      data.leaveApplyType, data.leaveFromDate, data.leaveToDate, data.reasonForLeave,
      data.approvalManager, data.skipLevelManager, data.leaveApprovalStatus,
      empId
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update leave status only
  static async updateStatus(empId, status) {
    const query = `
      UPDATE leave_management SET
        leave_approval_status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE emp_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, empId]);
    return result.rows[0];
  }

  // Delete leave record
  static async delete(empId) {
    const query = 'DELETE FROM leave_management WHERE emp_id = $1 RETURNING *';
    const result = await pool.query(query, [empId]);
    return result.rows[0];
  }

  // Get leave balance summary
  static async getLeaveBalance(empId) {
    const query = `
      SELECT 
        emp_id, emp_name,
        sick_leaves_allocated, sick_leaves_consumed, sick_leaves_remaining,
        rh_allocated, rh_consumed, rh_remaining,
        pl_allocated, pl_consumed, pl_remaining
      FROM leave_management 
      WHERE emp_id = $1
    `;
    const result = await pool.query(query, [empId]);
    return result.rows[0];
  }

  // Get leave statistics
  static async getLeaveStatistics(empId) {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE leave_approval_status = 'Approved') as total_approved,
        COUNT(*) FILTER (WHERE leave_approval_status = 'Pending') as total_pending,
        COUNT(*) FILTER (WHERE leave_approval_status = 'Rejected') as total_rejected,
        COUNT(*) as total_requests,
        SUM(
          CASE 
            WHEN leave_from_date IS NOT NULL AND leave_to_date IS NOT NULL 
            THEN (leave_to_date - leave_from_date + 1)
            ELSE 0 
          END
        ) FILTER (WHERE leave_approval_status = 'Approved') as total_days_taken
      FROM leave_management 
      WHERE emp_id = $1
    `;
    const result = await pool.query(query, [empId]);
    return result.rows[0];
  }
}

module.exports = Leave;