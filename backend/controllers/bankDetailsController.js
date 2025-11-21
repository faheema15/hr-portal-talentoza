const BankDetails = require('../models/BankDetails');
const pool = require('../config/database');

// Create new bank details record
exports.createBankDetails = async (req, res) => {
  try {
    const bankDetails = await BankDetails.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Bank details created successfully',
      data: bankDetails
    });
  } catch (error) {
    console.error('Error creating bank details:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating bank details',
      error: error.message
    });
  }
};

// Get all bank details
exports.getAllBankDetails = async (req, res) => {
  try {
    const bankDetails = await BankDetails.findAll();
    res.status(200).json({
      success: true,
      data: bankDetails
    });
  } catch (error) {
    console.error('Error fetching bank details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bank details',
      error: error.message
    });
  }
};

// Get bank details by ID 
exports.getBankDetailsById = async (req, res) => {
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
        ed.aadhar_no,
        ed.pan_no,
        ed.passport_no,
        ed.dob,
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
    
    // Fetch bank details (might not exist yet)
    const bankQuery = `
      SELECT 
        bank_name,
        branch_address,
        account_number,
        ifsc_code
      FROM bank_details
      WHERE emp_id = $1
      AND (end_date IS NULL OR end_date > CURRENT_DATE)
      ORDER BY is_primary DESC, created_at DESC
      LIMIT 1
    `;
    
    const bankResult = await pool.query(bankQuery, [empId]);
    const bankData = bankResult.rows[0] || {};
    
    // Combine all data
    const responseData = {
      // Employee basic info (prefilled)
      empId: employeeData.emp_id,
      empName: employeeData.full_name,
      photo: employeeData.photo_url,
      
      // From employee_details (prefilled)
      dob: employeeData.dob,
      aadharNumber: employeeData.aadhar_no,
      panNumber: employeeData.pan_no,
      passportNumber: employeeData.passport_no,
      
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
      
      // Bank specific info (editable by HR)
      bankName: bankData.bank_name || "",
      branchAddress: bankData.branch_address || "",
      bankAccountNumber: bankData.account_number || "",
      ifscCode: bankData.ifsc_code || ""
    };
    
    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching bank details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bank details',
      error: error.message
    });
  }
};

// Get bank details by account number
exports.getBankDetailsByAccountNumber = async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const bankDetails = await BankDetails.findByAccountNumber(accountNumber);
    if (!bankDetails) {
      return res.status(404).json({
        success: false,
        message: 'Bank details not found for this account number'
      });
    }
    res.status(200).json({
      success: true,
      data: bankDetails
    });
  } catch (error) {
    console.error('Error fetching bank details by account number:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bank details by account number',
      error: error.message
    });
  }
};

// Get employees by bank name
exports.getEmployeesByBank = async (req, res) => {
  try {
    const { bankName } = req.params;
    const employees = await BankDetails.findByBankName(bankName);
    res.status(200).json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error('Error fetching employees by bank:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees by bank',
      error: error.message
    });
  }
};

// Get employees by IFSC code
exports.getEmployeesByIFSC = async (req, res) => {
  try {
    const { ifscCode } = req.params;
    const employees = await BankDetails.findByIFSC(ifscCode);
    res.status(200).json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error('Error fetching employees by IFSC:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees by IFSC',
      error: error.message
    });
  }
};

// Search by PAN number
exports.searchByPAN = async (req, res) => {
  try {
    const { panNumber } = req.params;
    const bankDetails = await BankDetails.findByPAN(panNumber);
    if (!bankDetails) {
      return res.status(404).json({
        success: false,
        message: 'Bank details not found for this PAN number'
      });
    }
    res.status(200).json({
      success: true,
      data: bankDetails
    });
  } catch (error) {
    console.error('Error searching by PAN:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching by PAN',
      error: error.message
    });
  }
};

// Search by Aadhar number
exports.searchByAadhar = async (req, res) => {
  try {
    const { aadharNumber } = req.params;
    const bankDetails = await BankDetails.findByAadhar(aadharNumber);
    if (!bankDetails) {
      return res.status(404).json({
        success: false,
        message: 'Bank details not found for this Aadhar number'
      });
    }
    res.status(200).json({
      success: true,
      data: bankDetails
    });
  } catch (error) {
    console.error('Error searching by Aadhar:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching by Aadhar',
      error: error.message
    });
  }
};

// Update bank details
exports.updateBankDetails = async (req, res) => {
  try {
    const bankDetails = await BankDetails.update(req.params.id, req.body);
    if (!bankDetails) {
      return res.status(404).json({
        success: false,
        message: 'Bank details not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Bank details updated successfully',
      data: bankDetails
    });
  } catch (error) {
    console.error('Error updating bank details:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating bank details',
      error: error.message
    });
  }
};

// Update only banking information
exports.updateBankingInfo = async (req, res) => {
  try {
    const bankDetails = await BankDetails.updateBankingInfo(req.params.id, req.body);
    if (!bankDetails) {
      return res.status(404).json({
        success: false,
        message: 'Bank details not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Banking information updated successfully',
      data: bankDetails
    });
  } catch (error) {
    console.error('Error updating banking information:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating banking information',
      error: error.message
    });
  }
};

// Delete bank details
exports.deleteBankDetails = async (req, res) => {
  try {
    const bankDetails = await BankDetails.delete(req.params.id);
    if (!bankDetails) {
      return res.status(404).json({
        success: false,
        message: 'Bank details not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Bank details deleted successfully',
      data: bankDetails
    });
  } catch (error) {
    console.error('Error deleting bank details:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting bank details',
      error: error.message
    });
  }
};

// Get bank-wise summary
exports.getBankWiseSummary = async (req, res) => {
  try {
    const summary = await BankDetails.getBankWiseSummary();
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching bank-wise summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bank-wise summary',
      error: error.message
    });
  }
};

// Get employees with incomplete bank details
exports.getIncompleteBankDetails = async (req, res) => {
  try {
    const employees = await BankDetails.findIncompleteBankDetails();
    res.status(200).json({
      success: true,
      message: 'Employees with incomplete bank details',
      data: employees
    });
  } catch (error) {
    console.error('Error fetching incomplete bank details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching incomplete bank details',
      error: error.message
    });
  }
};

// Verify bank details completeness
exports.verifyCompleteness = async (req, res) => {
  try {
    const verification = await BankDetails.verifyCompleteness(req.params.id);
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Bank details not found'
      });
    }
    res.status(200).json({
      success: true,
      data: verification
    });
  } catch (error) {
    console.error('Error verifying bank details:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying bank details',
      error: error.message
    });
  }
};

// Get statistics
exports.getStatistics = async (req, res) => {
  try {
    const stats = await BankDetails.getStatistics();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};