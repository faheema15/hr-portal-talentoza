const Attendance = require('../models/Attendance');
const pool = require('../config/database');
const AttendanceService = require('../services/attendanceService');

// Create new attendance employee record
exports.createAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Attendance record created successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Error creating attendance record:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating attendance record',
      error: error.message
    });
  }
};

// Get all attendance records
exports.getAllAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findAll();
    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance records',
      error: error.message
    });
  }
};

// Get attendance by employee ID
exports.getAttendanceById = async (req, res) => {
  try {
    const empId = req.params.id;
    
    // Fetch employee basic details
    const employeeQuery = `
      SELECT 
        ed.emp_id,
        ed.full_name,
        ed.designation,
        ed.department_id,
        ed.reporting_manager_id,
        ed.contact1,
        ed.contact2,
        ed.email1,
        ed.email2,
        ed.photo_url,
        d.name as department_name,
        COALESCE(rm_user.name, rm_emp.full_name, 'Not Assigned') as reporting_manager_name
      FROM employee_details ed
      LEFT JOIN departments d ON ed.department_id = d.id
      LEFT JOIN users rm_user ON ed.reporting_manager_id = rm_user.id
      LEFT JOIN employee_details rm_emp ON ed.reporting_manager_id = rm_emp.user_id
      WHERE ed.emp_id = $1
    `;
    
    const employeeResult = await pool.query(employeeQuery, [empId]);
    
    if (employeeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    const employeeData = employeeResult.rows[0];
    
    // Combine all data
    const responseData = {
      // Employee basic info (prefilled)
      empId: employeeData.emp_id,
      empName: employeeData.full_name,
      photo: employeeData.photo_url,
      
      // Organizational info (prefilled)
      designation: employeeData.designation,
      department: employeeData.department_name,
      departmentId: employeeData.department_id,
      reportingManagerName: employeeData.reporting_manager_name,
      
      // Contact info (prefilled)
      contact1: employeeData.contact1,
      contact2: employeeData.contact2,
      mailId1: employeeData.email1,
      mailId2: employeeData.email2,
      
      // Attendance specific info (editable by HR)
      shiftTimings: "",
      regularisationDays: ""
    };
    
    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching attendance record:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance record',
      error: error.message
    });
  }
};

// Update attendance record
exports.updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.update(req.params.id, req.body);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Error updating attendance record:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating attendance record',
      error: error.message
    });
  }
};

// Delete attendance record
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.delete(req.params.id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting attendance record',
      error: error.message
    });
  }
};

// ==================== Attendance Records Controllers ====================

// Create single attendance record
exports.createAttendanceRecord = async (req, res) => {
  try {
    const record = await Attendance.createAttendanceRecord(req.body);
    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: record
    });
  } catch (error) {
    console.error('Error creating attendance record:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating attendance record',
      error: error.message
    });
  }
};

// Create bulk attendance records
exports.createBulkAttendanceRecords = async (req, res) => {
  try {
    const { records } = req.body;
    
    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Records array is required'
      });
    }

    const results = await Attendance.createBulkAttendanceRecords(records);
    res.status(201).json({
      success: true,
      message: `${results.length} attendance records saved successfully`,
      data: results
    });
  } catch (error) {
    console.error('Error creating bulk attendance records:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating bulk attendance records',
      error: error.message
    });
  }
};

// Get attendance records by date range
exports.getAttendanceRecords = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }

    const records = await Attendance.getAttendanceRecords(id, startDate, endDate);
    res.status(200).json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance records',
      error: error.message
    });
  }
};

// Get monthly attendance
exports.getMonthlyAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'year and month are required'
      });
    }

    const records = await Attendance.getMonthlyAttendance(id, parseInt(year), parseInt(month));
    res.status(200).json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('Error fetching monthly attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly attendance',
      error: error.message
    });
  }
};

// Get attendance summary
exports.getAttendanceSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }

    const summary = await Attendance.getAttendanceSummary(id, startDate, endDate);
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance summary',
      error: error.message
    });
  }
};

// Get department attendance summary
exports.getDepartmentAttendanceSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }

    const summary = await Attendance.getDepartmentAttendanceSummary(startDate, endDate);
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching department attendance summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching department attendance summary',
      error: error.message
    });
  }
};

// Get employees with low attendance
exports.getLowAttendanceEmployees = async (req, res) => {
  try {
    const { startDate, endDate, threshold } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }

    const thresholdValue = threshold ? parseFloat(threshold) : 75;
    const employees = await Attendance.getLowAttendanceEmployees(thresholdValue, startDate, endDate);
    
    res.status(200).json({
      success: true,
      message: `Employees with attendance below ${thresholdValue}%`,
      data: employees
    });
  } catch (error) {
    console.error('Error fetching low attendance employees:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching low attendance employees',
      error: error.message
    });
  }
};

// Get daily attendance report
exports.getDailyAttendanceReport = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'date is required (format: YYYY-MM-DD)'
      });
    }

    const report = await Attendance.getDailyAttendanceReport(date);
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching daily attendance report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily attendance report',
      error: error.message
    });
  }
};

// Mark today's attendance
// Mark today's attendance
exports.markTodayAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['present', 'absent', 'leave', 'half_day'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (present, absent, leave, half_day)'
      });
    }

    const record = await Attendance.markTodayAttendance(id, status);
    res.status(200).json({
      success: true,
      message: 'Today\'s attendance marked successfully',
      data: record
    });
  } catch (error) {
    console.error('Error marking today\'s attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking today\'s attendance',
      error: error.message
    });
  }
}; // ✅ CLOSE markTodayAttendance HERE

// Initialize attendance for all employees for current month
exports.initializeMonthlyAttendance = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Get current month start and end dates
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    
    const startDate = startOfMonth.toISOString().split('T')[0];
    const endDate = endOfMonth.toISOString().split('T')[0];
    
    // USE THE SERVICE to get holidays from Google Calendar
    const year = startOfMonth.getFullYear();
    const holidays = await AttendanceService.getGovernmentHolidays(year);
    
    // Initialize attendance for all active employees WITH GOOGLE CALENDAR HOLIDAYS
    const query = `
      INSERT INTO attendance_records (emp_id, attendance_date, status)
      SELECT 
        ed.emp_id,
        date_series,
        CASE 
          WHEN EXTRACT(DOW FROM date_series) = 0 THEN 'leave'  -- Sunday
          WHEN date_series = ANY($3::date[]) THEN 'leave'      -- Google Calendar Holidays
          ELSE 'present'  -- Mon-Sat default to present
        END
      FROM employee_details ed
      CROSS JOIN generate_series($1::date, $2::date, '1 day'::interval) AS date_series
      ON CONFLICT (emp_id, attendance_date) DO NOTHING
    `;
    
    const result = await client.query(query, [startDate, endDate, holidays]);
    
    await client.query('COMMIT');
    
    res.status(200).json({
      success: true,
      message: `Initialized attendance for current month with ${holidays.length} holidays`,
      recordsCreated: result.rowCount,
      dateRange: { startDate, endDate },
      holidays: holidays
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing monthly attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing monthly attendance',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Initialize attendance for a specific employee for current month
exports.initializeEmployeeAttendance = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // **FIX: Get the actual current date (not one month off)**
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const startDate = startOfMonth.toISOString().split('T')[0];
    const endDate = endOfMonth.toISOString().split('T')[0];
    
    console.log(`Initializing attendance for emp ${id}: ${startDate} to ${endDate}`);
    
    // Get holidays
    const year = startOfMonth.getFullYear();
    const holidays = await AttendanceService.getGovernmentHolidays(year);
    
    console.log(`Found ${holidays.length} holidays for ${year}:`, holidays);
    
    // Use UPSERT to update existing records
    const query = `
      INSERT INTO attendance_records (emp_id, attendance_date, status)
      SELECT $1, date_series, 
        CASE 
          WHEN EXTRACT(DOW FROM date_series) = 0 THEN 'leave'  -- Sunday
          WHEN date_series = ANY($2::date[]) THEN 'leave'      -- Government holiday
          ELSE 'present'
        END as status
      FROM generate_series($3::date, $4::date, '1 day'::interval) AS date_series
      ON CONFLICT (emp_id, attendance_date) 
      DO UPDATE SET 
        status = CASE 
          WHEN EXTRACT(DOW FROM attendance_records.attendance_date) = 0 THEN 'leave'
          WHEN attendance_records.attendance_date = ANY($2::date[]) THEN 'leave'
          ELSE 'present'
        END,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await client.query(query, [id, holidays, startDate, endDate]);
    
    console.log(`Created/updated ${result.rowCount} attendance records`);
    
    await client.query('COMMIT');
    
    res.status(200).json({
      success: true,
      message: `Initialized attendance for employee ${id}`,
      recordsCreated: result.rowCount,
      dateRange: { startDate, endDate },
      holidays: holidays
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing employee attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing employee attendance',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Get government holidays for a year
exports.getGovernmentHolidays = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    const holidays = await AttendanceService.getGovernmentHolidays(targetYear);
    
    res.status(200).json({
      success: true,
      year: targetYear,
      holidays: holidays,
      count: holidays.length
    });
  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching holidays',
      error: error.message
    });
  }
};