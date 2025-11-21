const pool = require('../config/database');

class Attendance {
  // Create attendance employee record
  static async create(data) {
    const query = `
      INSERT INTO attendance (
        emp_id, photo, emp_name, designation, department_id, department_name,
        reporting_manager, project_name, shift_timings, regularisation_days
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      data.empId, data.photo, data.empName, data.designation, data.departmentId, data.departmentName,
      data.reportingManager, data.projectName, data.shiftTimings, data.regularisationDays
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get all attendance records
  static async findAll() {
    const query = 'SELECT * FROM attendance ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  // Get attendance by emp_id
  static async findByEmpId(empId) {
    const query = 'SELECT * FROM attendance WHERE emp_id = $1';
    const result = await pool.query(query, [empId]);
    return result.rows[0];
  }

  // Update attendance record
  static async update(empId, data) {
    const query = `
      UPDATE attendance SET
        photo = $1, emp_name = $2, designation = $3, department_id = $4, department_name = $5,
        reporting_manager = $6, project_name = $7, shift_timings = $8, regularisation_days = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE emp_id = $10
      RETURNING *
    `;
    
    const values = [
      data.photo, data.empName, data.designation, data.departmentId, data.departmentName,
      data.reportingManager, data.projectName, data.shiftTimings, data.regularisationDays,
      empId
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete attendance record
  static async delete(empId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete all attendance records first
      await client.query('DELETE FROM attendance_records WHERE emp_id = $1', [empId]);
      
      // Delete employee attendance record
      const result = await client.query('DELETE FROM attendance WHERE emp_id = $1 RETURNING *', [empId]);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ==================== Attendance Records Methods ====================

  // Create single attendance record
  static async createAttendanceRecord(data) {
    const query = `
      INSERT INTO attendance_records (emp_id, attendance_date, status)
      VALUES ($1, $2, $3)
      ON CONFLICT (emp_id, attendance_date) 
      DO UPDATE SET status = $3, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await pool.query(query, [data.empId, data.attendanceDate, data.status]);
    return result.rows[0];
  }

  // Create bulk attendance records
  static async createBulkAttendanceRecords(records) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const results = [];
      for (const record of records) {
        const query = `
          INSERT INTO attendance_records (emp_id, attendance_date, status)
          VALUES ($1, $2, $3)
          ON CONFLICT (emp_id, attendance_date) 
          DO UPDATE SET status = $3, updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `;
        const result = await client.query(query, [record.empId, record.attendanceDate, record.status]);
        results.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get attendance records for an employee by date range
  static async getAttendanceRecords(empId, startDate, endDate) {
    const query = `
      SELECT * FROM attendance_records
      WHERE emp_id = $1 
        AND attendance_date BETWEEN $2 AND $3
      ORDER BY attendance_date ASC
    `;
    const result = await pool.query(query, [empId, startDate, endDate]);
    return result.rows;
  }

  // Get attendance records for a specific month
  static async getMonthlyAttendance(empId, year, month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    
    return await this.getAttendanceRecords(empId, startDate, endDate);
  }

  // Get attendance summary for an employee
  static async getAttendanceSummary(empId, startDate, endDate) {
    const query = `
      SELECT 
        COUNT(*) as total_days,
        COUNT(*) FILTER (WHERE status = 'present') as present_days,
        COUNT(*) FILTER (WHERE status = 'absent') as absent_days,
        COUNT(*) FILTER (WHERE status = 'leave') as leave_days,
        ROUND(
          (COUNT(*) FILTER (WHERE status = 'present')::DECIMAL / 
          NULLIF(COUNT(*), 0) * 100), 2
        ) as attendance_percentage
      FROM attendance_records
      WHERE emp_id = $1 
        AND attendance_date BETWEEN $2 AND $3
    `;
    const result = await pool.query(query, [empId, startDate, endDate]);
    return result.rows[0];
  }

  // Get department-wise attendance summary
  static async getDepartmentAttendanceSummary(startDate, endDate) {
    const query = `
      SELECT 
        a.department_name,
        COUNT(DISTINCT a.emp_id) as total_employees,
        COUNT(ar.*) as total_records,
        COUNT(*) FILTER (WHERE ar.status = 'present') as present_count,
        COUNT(*) FILTER (WHERE ar.status = 'absent') as absent_count,
        COUNT(*) FILTER (WHERE ar.status = 'leave') as leave_count,
        ROUND(
          (COUNT(*) FILTER (WHERE ar.status = 'present')::DECIMAL / 
          NULLIF(COUNT(ar.*), 0) * 100), 2
        ) as attendance_percentage
      FROM attendance a
      LEFT JOIN attendance_records ar ON a.emp_id = ar.emp_id
        AND ar.attendance_date BETWEEN $1 AND $2
      WHERE a.department_name IS NOT NULL AND a.department_name != ''
      GROUP BY a.department_name
      ORDER BY attendance_percentage DESC
    `;
    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  }

  // Get employees with low attendance
  static async getLowAttendanceEmployees(threshold = 75, startDate, endDate) {
    const query = `
      SELECT 
        a.emp_id,
        a.emp_name,
        a.department_name,
        a.reporting_manager,
        COUNT(*) as total_days,
        COUNT(*) FILTER (WHERE ar.status = 'present') as present_days,
        ROUND(
          (COUNT(*) FILTER (WHERE ar.status = 'present')::DECIMAL / 
          NULLIF(COUNT(*), 0) * 100), 2
        ) as attendance_percentage
      FROM attendance a
      JOIN attendance_records ar ON a.emp_id = ar.emp_id
      WHERE ar.attendance_date BETWEEN $1 AND $2
      GROUP BY a.emp_id, a.emp_name, a.department_name, a.reporting_manager
      HAVING ROUND(
        (COUNT(*) FILTER (WHERE ar.status = 'present')::DECIMAL / 
        NULLIF(COUNT(*), 0) * 100), 2
      ) < $3
      ORDER BY attendance_percentage ASC
    `;
    const result = await pool.query(query, [startDate, endDate, threshold]);
    return result.rows;
  }

  // Get daily attendance report
  static async getDailyAttendanceReport(date) {
    const query = `
      SELECT 
        a.emp_id,
        a.emp_name,
        a.department_name,
        a.designation,
        COALESCE(ar.status, 'not_marked') as status
      FROM attendance a
      LEFT JOIN attendance_records ar ON a.emp_id = ar.emp_id AND ar.attendance_date = $1
      ORDER BY a.department_name, a.emp_name
    `;
    const result = await pool.query(query, [date]);
    return result.rows;
  }

  // Mark attendance for today
  static async markTodayAttendance(empId, status) {
    const today = new Date().toISOString().split('T')[0];
    const query = `
      INSERT INTO attendance_records (emp_id, attendance_date, status)
      VALUES ($1, $2, $3)
      ON CONFLICT (emp_id, attendance_date) 
      DO UPDATE SET status = $3, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await pool.query(query, [empId, today, status]);
    return result.rows[0];
  }
}

module.exports = Attendance;