const Insurance = require('../models/Insurance');
const pool = require('../config/database');

// Create new insurance record
exports.createInsurance = async (req, res) => {
  try {
    const insurance = await Insurance.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Insurance record created successfully',
      data: insurance
    });
  } catch (error) {
    console.error('Error creating insurance record:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating insurance record',
      error: error.message
    });
  }
};

// Get all insurance records
exports.getAllInsurance = async (req, res) => {
  try {
    const insurance = await Insurance.findAll();
    res.status(200).json({
      success: true,
      data: insurance
    });
  } catch (error) {
    console.error('Error fetching insurance records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insurance records',
      error: error.message
    });
  }
};

// Get insurance by employee ID
exports.getInsuranceById = async (req, res) => {
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
    
    // Fetch latest insurance details (might not exist yet)
    const insuranceQuery = `
      SELECT 
        provider,
        policy_number,
        policy_type,
        coverage_amount,
        premium_amount,
        start_date,
        end_date,
        status,
        remarks
      FROM insurance
      WHERE emp_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const insuranceResult = await pool.query(insuranceQuery, [empId]);
    const insuranceData = insuranceResult.rows[0] || {};
    
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
      
      // Insurance specific info (editable by HR)
      insuranceProvider: insuranceData.provider || "",
      policyNumber: insuranceData.policy_number || "",
      policyType: insuranceData.policy_type || "",
      coverageAmount: insuranceData.coverage_amount || "",
      premiumAmount: insuranceData.premium_amount || "",
      policyStartDate: insuranceData.start_date || "",
      policyEndDate: insuranceData.end_date || "",
      policyStatus: insuranceData.status || "Active",
      remarks: insuranceData.remarks || ""
    };
    
    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching insurance record:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insurance record',
      error: error.message
    });
  }
};

// Get insurance history by employee ID
exports.getInsuranceHistory = async (req, res) => {
  try {
    const insurance = await Insurance.findAllByEmpId(req.params.id);
    res.status(200).json({
      success: true,
      data: insurance
    });
  } catch (error) {
    console.error('Error fetching insurance history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insurance history',
      error: error.message
    });
  }
};

// Get insurance by policy number
exports.getInsuranceByPolicyNumber = async (req, res) => {
  try {
    const insurance = await Insurance.findByPolicyNumber(req.params.policyNumber);
    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: 'Insurance policy not found'
      });
    }
    res.status(200).json({
      success: true,
      data: insurance
    });
  } catch (error) {
    console.error('Error fetching insurance by policy number:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insurance by policy number',
      error: error.message
    });
  }
};

// Get insurance by status
exports.getInsuranceByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const insurance = await Insurance.findByStatus(status);
    res.status(200).json({
      success: true,
      data: insurance
    });
  } catch (error) {
    console.error('Error fetching insurance by status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insurance by status',
      error: error.message
    });
  }
};

// Get expiring policies
exports.getExpiringPolicies = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const insurance = await Insurance.findExpiringPolicies(days);
    res.status(200).json({
      success: true,
      message: `Policies expiring in next ${days} days`,
      data: insurance
    });
  } catch (error) {
    console.error('Error fetching expiring policies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expiring policies',
      error: error.message
    });
  }
};

// Get expired policies
exports.getExpiredPolicies = async (req, res) => {
  try {
    const insurance = await Insurance.findExpiredPolicies();
    res.status(200).json({
      success: true,
      data: insurance
    });
  } catch (error) {
    console.error('Error fetching expired policies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expired policies',
      error: error.message
    });
  }
};

// Update insurance record
exports.updateInsurance = async (req, res) => {
  try {
    const insurance = await Insurance.update(req.params.id, req.body);
    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: 'Insurance record not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Insurance record updated successfully',
      data: insurance
    });
  } catch (error) {
    console.error('Error updating insurance record:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating insurance record',
      error: error.message
    });
  }
};

// Update policy status
exports.updateInsuranceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['Active', 'Expired', 'Pending', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (Active, Expired, Pending, Cancelled)'
      });
    }

    const insurance = await Insurance.updateStatus(req.params.id, status);
    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: 'Insurance record not found'
      });
    }
    res.status(200).json({
      success: true,
      message: `Insurance status updated to ${status}`,
      data: insurance
    });
  } catch (error) {
    console.error('Error updating insurance status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating insurance status',
      error: error.message
    });
  }
};

// Delete insurance record
exports.deleteInsurance = async (req, res) => {
  try {
    const insurance = await Insurance.delete(req.params.id);
    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: 'Insurance record not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Insurance record deleted successfully',
      data: insurance
    });
  } catch (error) {
    console.error('Error deleting insurance record:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting insurance record',
      error: error.message
    });
  }
};

// Get insurance summary
exports.getInsuranceSummary = async (req, res) => {
  try {
    const summary = await Insurance.getSummary(req.params.id);
    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'Insurance summary not found'
      });
    }
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching insurance summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insurance summary',
      error: error.message
    });
  }
};

// Get insurance statistics
exports.getInsuranceStatistics = async (req, res) => {
  try {
    const stats = await Insurance.getStatistics();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching insurance statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insurance statistics',
      error: error.message
    });
  }
};

// Get expiring policies with employee details
exports.getExpiringPoliciesWithDetails = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const policies = await Insurance.getExpiringPoliciesWithDetails(days);
    res.status(200).json({
      success: true,
      message: `Policies expiring in next ${days} days with employee details`,
      data: policies
    });
  } catch (error) {
    console.error('Error fetching expiring policies with details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expiring policies with details',
      error: error.message
    });
  }
};