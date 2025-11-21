const BGV = require('../models/BGV');
const pool = require('../config/database');

// Create new BGV record
exports.createBGV = async (req, res) => {
  try {
    const bgv = await BGV.create(req.body);
    res.status(201).json({
      success: true,
      message: 'BGV record created successfully',
      data: bgv
    });
  } catch (error) {
    console.error('Error creating BGV record:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating BGV record',
      error: error.message
    });
  }
};

// Get all BGV records
exports.getAllBGV = async (req, res) => {
  try {
    const bgv = await BGV.findAll();
    res.status(200).json({
      success: true,
      data: bgv
    });
  } catch (error) {
    console.error('Error fetching BGV records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching BGV records',
      error: error.message
    });
  }
};

// Get BGV by employee ID
exports.getBGVById = async (req, res) => {
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
    
    // Fetch joining details for date of joining
    const joiningQuery = `
      SELECT date_of_joining
      FROM joining_details
      WHERE emp_id = $1
    `;
    
    const joiningResult = await pool.query(joiningQuery, [empId]);
    const joiningData = joiningResult.rows[0];
    
    // Fetch BGV details (might not exist yet)
    const bgvQuery = `
      SELECT 
        status,
        remarks
      FROM bgv
      WHERE emp_id = $1
    `;
    
    const bgvResult = await pool.query(bgvQuery, [empId]);
    const bgvData = bgvResult.rows[0] || {};
    
    // Combine all data
    const responseData = {
      // Employee basic info (prefilled)
      empId: employeeData.emp_id,
      empName: employeeData.full_name,
      photo: employeeData.photo_url,
      
      // Organizational info (prefilled)
      designation: employeeData.designation,
      department: employeeData.department_name,
      reportingManagerName: employeeData.reporting_manager_name,
      
      // Contact info (prefilled)
      contact1: employeeData.contact1,
      contact2: employeeData.contact2,
      mailId1: employeeData.email1,
      mailId2: employeeData.email2,
      
      // From joining_details (prefilled)
      dateOfJoining: joiningData?.date_of_joining || null,
      
      // BGV specific info (editable by HR)
      bgvStatus: bgvData.status || "",
      reasonForReject: bgvData.remarks || ""
    };
    
    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching BGV record:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching BGV record',
      error: error.message
    });
  }
};

// Get BGV records by status
exports.getBGVByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    if (!['Green', 'Yellow', 'Red'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (Green, Yellow, Red)'
      });
    }

    const bgv = await BGV.findByStatus(status);
    res.status(200).json({
      success: true,
      data: bgv
    });
  } catch (error) {
    console.error('Error fetching BGV by status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching BGV by status',
      error: error.message
    });
  }
};

// Get pending BGV records
exports.getPendingBGV = async (req, res) => {
  try {
    const bgv = await BGV.findPendingBGV();
    res.status(200).json({
      success: true,
      message: 'Pending BGV records',
      data: bgv
    });
  } catch (error) {
    console.error('Error fetching pending BGV:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending BGV',
      error: error.message
    });
  }
};

// Get failed BGV records (Yellow or Red)
exports.getFailedBGV = async (req, res) => {
  try {
    const bgv = await BGV.findFailedBGV();
    res.status(200).json({
      success: true,
      message: 'Failed BGV records',
      data: bgv
    });
  } catch (error) {
    console.error('Error fetching failed BGV:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching failed BGV',
      error: error.message
    });
  }
};

// Get BGV records by department
exports.getBGVByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    const bgv = await BGV.findByDepartment(department);
    res.status(200).json({
      success: true,
      data: bgv
    });
  } catch (error) {
    console.error('Error fetching BGV by department:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching BGV by department',
      error: error.message
    });
  }
};

// Update BGV record
exports.updateBGV = async (req, res) => {
  try {
    const bgv = await BGV.update(req.params.id, req.body);
    if (!bgv) {
      return res.status(404).json({
        success: false,
        message: 'BGV record not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'BGV record updated successfully',
      data: bgv
    });
  } catch (error) {
    console.error('Error updating BGV record:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating BGV record',
      error: error.message
    });
  }
};

// Update BGV status only
exports.updateBGVStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    if (!status || !['Green', 'Yellow', 'Red'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (Green, Yellow, Red)'
      });
    }

    const bgv = await BGV.updateStatus(req.params.id, status, reason);
    if (!bgv) {
      return res.status(404).json({
        success: false,
        message: 'BGV record not found'
      });
    }
    res.status(200).json({
      success: true,
      message: `BGV status updated to ${status}`,
      data: bgv
    });
  } catch (error) {
    console.error('Error updating BGV status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating BGV status',
      error: error.message
    });
  }
};

// Delete BGV record
exports.deleteBGV = async (req, res) => {
  try {
    const bgv = await BGV.delete(req.params.id);
    if (!bgv) {
      return res.status(404).json({
        success: false,
        message: 'BGV record not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'BGV record deleted successfully',
      data: bgv
    });
  } catch (error) {
    console.error('Error deleting BGV record:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting BGV record',
      error: error.message
    });
  }
};

// Get BGV statistics
exports.getBGVStatistics = async (req, res) => {
  try {
    const stats = await BGV.getStatistics();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching BGV statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching BGV statistics',
      error: error.message
    });
  }
};

// Get BGV statistics by department
exports.getBGVStatisticsByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    const stats = await BGV.getStatisticsByDepartment(department);
    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'No BGV records found for this department'
      });
    }
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching BGV statistics by department:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching BGV statistics by department',
      error: error.message
    });
  }
};

// Get department-wise BGV summary
exports.getDepartmentWiseSummary = async (req, res) => {
  try {
    const summary = await BGV.getDepartmentWiseSummary();
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching department-wise summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching department-wise summary',
      error: error.message
    });
  }
};

// Get employees with BGV issues
exports.getEmployeesWithIssues = async (req, res) => {
  try {
    const employees = await BGV.getEmployeesWithIssues();
    res.status(200).json({
      success: true,
      message: 'Employees with BGV issues',
      data: employees
    });
  } catch (error) {
    console.error('Error fetching employees with BGV issues:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees with BGV issues',
      error: error.message
    });
  }
};