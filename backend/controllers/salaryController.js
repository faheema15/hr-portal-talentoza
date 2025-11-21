const Salary = require('../models/Salary');
const pool = require('../config/database');

// Create new salary record
exports.createSalary = async (req, res) => {
  try {
    const salary = await Salary.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Salary record created successfully',
      data: salary
    });
  } catch (error) {
    console.error('Error creating salary record:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating salary record',
      error: error.message
    });
  }
};

// Get all salary records
exports.getAllSalaries = async (req, res) => {
  try {
    const salaries = await Salary.findAll();
    res.status(200).json({
      success: true,
      data: salaries
    });
  } catch (error) {
    console.error('Error fetching salary records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching salary records',
      error: error.message
    });
  }
};

// Get salary by employee ID
exports.getSalaryById = async (req, res) => {
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
    
    // Fetch latest salary details (might not exist yet)
    const salaryQuery = `
      SELECT 
        salary_month,
        basic_salary,
        hra,
        conveyance_allowance,
        medical_allowance,
        special_allowance,
        other_allowances,
        gross_salary,
        provident_fund,
        professional_tax,
        income_tax,
        total_deductions,
        net_salary,
        payment_mode,
        payment_date,
        remarks
      FROM salary
      WHERE emp_id = $1
      ORDER BY salary_month DESC
      LIMIT 1
    `;
    
    const salaryResult = await pool.query(salaryQuery, [empId]);
    const salaryData = salaryResult.rows[0] || {};
    
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
      
      // From joining_details (prefilled)
      dateOfJoining: joiningData?.date_of_joining || null,
      
      // Salary specific info (editable by HR)
      salaryMonth: salaryData.salary_month || "",
      basicSalary: salaryData.basic_salary || "",
      hra: salaryData.hra || "",
      conveyanceAllowance: salaryData.conveyance_allowance || "",
      medicalAllowance: salaryData.medical_allowance || "",
      specialAllowance: salaryData.special_allowance || "",
      otherAllowances: salaryData.other_allowances || "",
      grossSalary: salaryData.gross_salary || "",
      providentFund: salaryData.provident_fund || "",
      professionalTax: salaryData.professional_tax || "",
      incomeTax: salaryData.income_tax || "",
      totalDeductions: salaryData.total_deductions || "",
      netSalary: salaryData.net_salary || "",
      paymentMode: salaryData.payment_mode || "Bank Transfer",
      paymentDate: salaryData.payment_date || "",
      remarks: salaryData.remarks || ""
    };
    
    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching salary record:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching salary record',
      error: error.message
    });
  }
};

// Get salary history by employee ID
exports.getSalaryHistory = async (req, res) => {
  try {
    const salaries = await Salary.findAllByEmpId(req.params.id);
    res.status(200).json({
      success: true,
      data: salaries
    });
  } catch (error) {
    console.error('Error fetching salary history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching salary history',
      error: error.message
    });
  }
};

// Get salary by month
exports.getSalaryByMonth = async (req, res) => {
  try {
    const { id, month } = req.params;
    const salary = await Salary.findByMonth(id, month);
    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found for this month'
      });
    }
    res.status(200).json({
      success: true,
      data: salary
    });
  } catch (error) {
    console.error('Error fetching salary by month:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching salary by month',
      error: error.message
    });
  }
};

// Update salary
exports.updateSalary = async (req, res) => {
  try {
    const salary = await Salary.update(req.params.id, req.body);
    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Salary record updated successfully',
      data: salary
    });
  } catch (error) {
    console.error('Error updating salary record:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating salary record',
      error: error.message
    });
  }
};

// Delete salary
exports.deleteSalary = async (req, res) => {
  try {
    const salary = await Salary.delete(req.params.id);
    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Salary record deleted successfully',
      data: salary
    });
  } catch (error) {
    console.error('Error deleting salary record:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting salary record',
      error: error.message
    });
  }
};

// Get salary statistics
exports.getSalaryStatistics = async (req, res) => {
  try {
    const stats = await Salary.getStatistics(req.params.id);
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching salary statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching salary statistics',
      error: error.message
    });
  }
};