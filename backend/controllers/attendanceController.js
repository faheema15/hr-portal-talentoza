const Attendance = require('../models/Attendance');

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
    const attendance = await Attendance.findByEmpId(req.params.id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }
    res.status(200).json({
      success: true,
      data: attendance
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
exports.markTodayAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['present', 'absent', 'leave'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (present, absent, leave)'
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
};