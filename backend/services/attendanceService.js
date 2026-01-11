// backend/services/attendanceService.js
const pool = require('../config/database');
const googleCalendarService = require('./googleCalendarService');

class AttendanceService {
  /**
   * Get government holidays for a year from Google Calendar
   */
  static async getGovernmentHolidays(year) {
    try {
      const holidays = await googleCalendarService.getHolidaysWithCache(year);
      return holidays.map(h => h.date);
    } catch (error) {
      console.error('Error fetching holidays from Google Calendar:', error);
      // Return empty array if Google Calendar fails
      // Attendance will still work, just without holidays
      return [];
    }
  }

  /**
   * Initialize attendance for a date range
   * Marks Present for Mon-Sat, Leave for Sundays and government holidays
   */
  static async initializeAttendanceForRange(empId, startDate, endDate) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const year = new Date(startDate).getFullYear();
      const holidays = await this.getGovernmentHolidays(year);

      const query = `
        INSERT INTO attendance_records (emp_id, attendance_date, status)
        SELECT $1, date_series, 
          CASE 
            WHEN EXTRACT(DOW FROM date_series) = 0 THEN 'leave'  -- Sunday
            WHEN date_series = ANY($2::date[]) THEN 'leave'      -- Government holiday
            ELSE 'present'
          END as status
        FROM (
          SELECT generate_series($3::date, $4::date, '1 day'::interval)::date as date_series
        ) dates
        ON CONFLICT (emp_id, attendance_date) 
        DO NOTHING
      `;

      const result = await client.query(query, [empId, holidays, startDate, endDate]);

      await client.query('COMMIT');
      return result.rowCount;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Mark leave dates as absent when leave is approved
   */
  static async markLeaveAsAbsent(leaveId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get leave details
      const leaveQuery = `
        SELECT emp_id, from_date, to_date, status
        FROM leave_applications
        WHERE id = $1
      `;
      const leaveResult = await client.query(leaveQuery, [leaveId]);

      if (leaveResult.rows.length === 0) {
        throw new Error('Leave record not found');
      }

      const leave = leaveResult.rows[0];

      if (leave.status !== 'Approved') {
        throw new Error('Leave is not approved');
      }

      // Update all dates in the leave range to 'leave' status
      const updateQuery = `
        INSERT INTO attendance_records (emp_id, attendance_date, status)
        SELECT $1, date_series, 'leave'
        FROM (
          SELECT generate_series($2::date, $3::date, '1 day'::interval)::date as date_series
        ) dates
        ON CONFLICT (emp_id, attendance_date) 
        DO UPDATE SET status = 'leave', updated_at = CURRENT_TIMESTAMP
      `;

      const result = await client.query(updateQuery, [
        leave.emp_id,
        leave.from_date,
        leave.to_date
      ]);

      await client.query('COMMIT');
      return result.rowCount;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Revert leave dates to present when leave is rejected
   */
  static async revertLeaveToPresent(leaveId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get leave details
      const leaveQuery = `
        SELECT emp_id, from_date, to_date
        FROM leave_applications
        WHERE id = $1
      `;
      const leaveResult = await client.query(leaveQuery, [leaveId]);

      if (leaveResult.rows.length === 0) {
        throw new Error('Leave record not found');
      }

      const leave = leaveResult.rows[0];
      const year = new Date(leave.from_date).getFullYear();
      const holidays = await this.getGovernmentHolidays(year);

      // Update dates back to 'present' (unless Sunday or holiday)
      const updateQuery = `
        UPDATE attendance_records
        SET status = CASE 
          WHEN EXTRACT(DOW FROM attendance_date) = 0 THEN 'leave'  -- Sunday
          WHEN attendance_date = ANY($2::date[]) THEN 'leave'      -- Holiday
          ELSE 'present'
        END,
        updated_at = CURRENT_TIMESTAMP
        WHERE emp_id = $1 
          AND attendance_date BETWEEN $3 AND $4
      `;

      const result = await client.query(updateQuery, [
        leave.emp_id,
        holidays,
        leave.from_date,
        leave.to_date
      ]);

      await client.query('COMMIT');
      return result.rowCount;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get attendance summary for an employee
   */
  static async getAttendanceSummaryForMonth(empId, year, month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    const query = `
      SELECT 
        COUNT(*) as total_days,
        COUNT(*) FILTER (WHERE status = 'present') as days_present,
        COUNT(*) FILTER (WHERE status = 'leave') as days_leave,
        COUNT(*) FILTER (WHERE EXTRACT(DOW FROM attendance_date) != 0) as total_working_days,
        ROUND(
          (COUNT(*) FILTER (WHERE status = 'present')::DECIMAL / 
          NULLIF(COUNT(*) FILTER (WHERE EXTRACT(DOW FROM attendance_date) != 0), 0) * 100), 2
        ) as attendance_percentage
      FROM attendance_records
      WHERE emp_id = $1 
        AND attendance_date BETWEEN $2 AND $3
    `;

    const result = await pool.query(query, [empId, startDate, endDate]);
    return result.rows[0];
  }

  /**
   * Clear holiday cache (call this if you add new holidays)
   */
  static clearCache(year = null) {
    if (year) {
      console.log(`Clearing Google Calendar cache for year ${year}`);
      // Implementation would depend on cache structure
    }
  }
}

module.exports = AttendanceService;