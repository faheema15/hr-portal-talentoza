const Leave = require('../models/Leave');
const pool = require('../config/database');
const EmailService = require('../services/emailService');
const AttendanceService = require('../services/attendanceService');

// Create new leave record
exports.createLeave = async (req, res) => {
  try {
    const { empId, leaveFromDate, leaveToDate, leaveApplyType, reasonForLeave, duration } = req.body;

    // Validate required fields
    if (!empId || !leaveFromDate || !leaveToDate || !leaveApplyType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: empId, leaveFromDate, leaveToDate, leaveApplyType'
      });
    }

    // Get employee details for email
    const empQuery = `
      SELECT 
        ed.emp_id, ed.full_name, ed.email1, ed.email2,
        ed.designation, d.name as department, ed.reporting_manager_id
      FROM employee_details ed
      LEFT JOIN departments d ON ed.department_id = d.id
      WHERE ed.emp_id = $1
    `;
    const empResult = await pool.query(empQuery, [empId]);
    
    if (empResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const empData = empResult.rows[0];

    // Create leave record
    const leave = await Leave.create({
      empId,
      leaveFromDate,
      leaveToDate,
      leaveApplyType,
      reasonForLeave,
      leaveApprovalStatus: 'Pending'
    });

    try {
      // Send approval emails
      await EmailService.sendLeaveApprovalEmail(
        {
          ...leave,
          duration
        },
        empData
      );
    } catch (emailError) {
      console.error('Email sending failed, but leave was created:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Leave request created successfully. Approval emails sent.',
      data: leave
    });
  } catch (error) {
    console.error('Error creating leave record:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating leave record',
      error: error.message
    });
  }
};

// Get all leave records
exports.getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.findAll();
    res.status(200).json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error('Error fetching leave records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave records',
      error: error.message
    });
  }
};

// Get leave by employee ID
exports.getLeaveById = async (req, res) => {
  try {
    const empId = req.params.id;
    
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
    
    const leaveTypesQuery = `
      SELECT 
        leave_type,
        allocated,
        consumed,
        remaining
      FROM leave_types
      WHERE emp_id = $1 AND year = EXTRACT(YEAR FROM CURRENT_DATE)
    `;
    
    const leaveTypesResult = await pool.query(leaveTypesQuery, [empId]);
    const leaveTypes = leaveTypesResult.rows;
    
    let sickLeave = leaveTypes.find(lt => lt.leave_type === 'Sick Leave') || {};
    let rhLeave = leaveTypes.find(lt => lt.leave_type === 'RH') || {};
    let plLeave = leaveTypes.find(lt => lt.leave_type === 'PL') || {};
    
    const leaveAppQuery = `
      SELECT 
        leave_type,
        from_date,
        to_date,
        reason,
        status
      FROM leave_applications
      WHERE emp_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const leaveAppResult = await pool.query(leaveAppQuery, [empId]);
    const leaveApp = leaveAppResult.rows[0] || {};
    
    const responseData = {
      empId: employeeData.emp_id,
      empName: employeeData.full_name,
      photo: employeeData.photo_url,
      
      designation: employeeData.designation,
      department: employeeData.department_name,
      departmentId: employeeData.department_id,
      reportingManagerName: employeeData.reporting_manager_name,
      
      contact1: employeeData.contact1,
      contact2: employeeData.contact2,
      mailId1: employeeData.email1,
      mailId2: employeeData.email2,
      
      sickLeavesAllocated: sickLeave.allocated || "",
      sickLeavesConsumed: sickLeave.consumed || "",
      sickLeavesRemaining: sickLeave.remaining || "",
      
      rhAllocated: rhLeave.allocated || "",
      rhConsumed: rhLeave.consumed || "",
      rhRemaining: rhLeave.remaining || "",
      
      plAllocated: plLeave.allocated || "",
      plConsumed: plLeave.consumed || "",
      plRemaining: plLeave.remaining || "",
      
      leaveApplyType: leaveApp.leave_type || "",
      leaveFromDate: leaveApp.from_date || "",
      leaveToDate: leaveApp.to_date || "",
      reasonForLeave: leaveApp.reason || "",
      leaveApprovalStatus: leaveApp.status || "Pending"
    };
    
    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching leave record:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave record',
      error: error.message
    });
  }
};

// Get leave history by employee ID
exports.getLeaveHistory = async (req, res) => {
  try {
    const leaves = await Leave.findAllByEmpId(req.params.id);
    res.status(200).json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error('Error fetching leave history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave history',
      error: error.message
    });
  }
};

// Get pending leave requests
exports.getPendingLeaves = async (req, res) => {
  try {
    const leaves = await Leave.findPendingLeaves();
    res.status(200).json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error('Error fetching pending leaves:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending leaves',
      error: error.message
    });
  }
};

// Get leave requests by status
exports.getLeavesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const leaves = await Leave.findByStatus(status);
    res.status(200).json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error('Error fetching leaves by status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaves by status',
      error: error.message
    });
  }
};

// Get leave requests by date range
exports.getLeavesByDateRange = async (req, res) => {
  try {
    const { id } = req.params;
    const { fromDate, toDate } = req.query;
    
    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: 'fromDate and toDate are required'
      });
    }

    const leaves = await Leave.findByDateRange(id, fromDate, toDate);
    res.status(200).json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error('Error fetching leaves by date range:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaves by date range',
      error: error.message
    });
  }
};

// Update leave status (with email notification and AUTO ATTENDANCE MARKING)
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { leaveApprovalStatus } = req.body;
    const leaveId = req.params.id;
    
    if (!leaveApprovalStatus || !['Pending', 'Approved', 'Rejected'].includes(leaveApprovalStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Valid leaveApprovalStatus is required (Pending, Approved, Rejected)'
      });
    }

    // Get leave details
    const leaveQuery = `
      SELECT la.*, ed.full_name, ed.email1
      FROM leave_applications la
      LEFT JOIN employee_details ed ON la.emp_id = ed.emp_id
      WHERE la.id = $1
    `;
    
    const leaveResult = await pool.query(leaveQuery, [leaveId]);
    if (leaveResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Leave record not found'
      });
    }

    const leaveData = leaveResult.rows[0];

    // Update status
    const updatedLeave = await Leave.updateStatus(leaveId, leaveApprovalStatus);

    // AUTO ATTENDANCE MARKING
    if (leaveApprovalStatus === 'Approved') {
      try {
        await AttendanceService.markLeaveAsAbsent(leaveId);
        console.log(`Attendance marked as leave for emp_id: ${leaveData.emp_id}`);
      } catch (attendanceError) {
        console.error('Error marking attendance:', attendanceError);
        // Don't fail the leave approval if attendance marking fails
      }
    } else if (leaveApprovalStatus === 'Rejected') {
      try {
        await AttendanceService.revertLeaveToPresent(leaveId);
        console.log(`Attendance reverted for emp_id: ${leaveData.emp_id}`);
      } catch (attendanceError) {
        console.error('Error reverting attendance:', attendanceError);
      }
    }

    try {
      // Send confirmation email to employee
      await EmailService.sendLeaveApprovalConfirmation(
        leaveData,
        leaveData,
        leaveApprovalStatus
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(200).json({
      success: true,
      message: `Leave status updated to ${leaveApprovalStatus}`,
      data: updatedLeave
    });
  } catch (error) {
    console.error('Error updating leave status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating leave status',
      error: error.message
    });
  }
};

// Update leave record
exports.updateLeave = async (req, res) => {
  try {
    const leaveId = req.params.id;
    const leave = await Leave.update(leaveId, req.body);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave record not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Leave record updated successfully',
      data: leave
    });
  } catch (error) {
    console.error('Error updating leave record:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating leave record',
      error: error.message
    });
  }
};

// Delete leave record
exports.deleteLeave = async (req, res) => {
  try {
    const leaveId = req.params.id;
    const leave = await Leave.delete(leaveId);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave record not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Leave record deleted successfully',
      data: leave
    });
  } catch (error) {
    console.error('Error deleting leave record:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting leave record',
      error: error.message
    });
  }
};

// Get leave balance
exports.getLeaveBalance = async (req, res) => {
  try {
    const balance = await Leave.getLeaveBalance(req.params.id);
    if (!balance || balance.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Leave balance not found'
      });
    }
    res.status(200).json({
      success: true,
      data: balance
    });
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave balance',
      error: error.message
    });
  }
};

// Get leave statistics
exports.getLeaveStatistics = async (req, res) => {
  try {
    const stats = await Leave.getLeaveStatistics(req.params.id);
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching leave statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave statistics',
      error: error.message
    });
  }
};