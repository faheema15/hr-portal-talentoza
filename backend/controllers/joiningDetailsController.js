// backend/controllers/joiningDetailsController.js

const JoiningDetails = require('../models/JoiningDetails');
const pool = require('../config/database');

// Create new joining details
exports.createJoiningDetails = async (req, res) => {
  try {
    const joiningDetails = await JoiningDetails.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Joining details created successfully',
      data: joiningDetails
    });
  } catch (error) {
    console.error('Error creating joining details:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating joining details',
      error: error.message
    });
  }
};

// Get all joining details
exports.getAllJoiningDetails = async (req, res) => {
  try {
    const joiningDetails = await JoiningDetails.findAll();
    res.status(200).json({
      success: true,
      data: joiningDetails
    });
  } catch (error) {
    console.error('Error fetching joining details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching joining details',
      error: error.message
    });
  }
};

// Get joining details by ID 
exports.getJoiningDetailsById = async (req, res) => {
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
    
    // Fetch joining details (might not exist yet)
    const joiningDetails = await JoiningDetails.findByEmpId(empId);
    
    // Fetch previous employment from previous_employment table
    const previousEmploymentQuery = `
      SELECT 
        pe.id,
        pe.company_name as "companyName",
        pe.start_date as "startDate",
        pe.end_date as "endDate",
        pe.designation,
        pe.offer_letter_url as "offerLetter",
        pe.relieving_letter_url as "releavingLetter",
        pe.payslip_urls as "paySlips"
      FROM previous_employment pe
      JOIN joining_details jd ON pe.joining_id = jd.id
      WHERE jd.emp_id = $1
      ORDER BY pe.start_date DESC
    `;
    
    const previousEmploymentResult = await pool.query(previousEmploymentQuery, [empId]);
    
    // Combine all data
    const responseData = {
      // Employee basic info (prefilled)
      empId: employeeData.emp_id,
      fullName: employeeData.full_name,
      contact1: employeeData.contact1,
      contact2: employeeData.contact2,
      email1: employeeData.email1,
      email2: employeeData.email2,
      photo: employeeData.photo_url,
      
      // Organizational info (prefilled)
      designation: employeeData.designation,
      department: employeeData.department_name,
      departmentId: employeeData.department_id,
      reportingManagerId: employeeData.reporting_manager_id,
      reportingManagerName: employeeData.reporting_manager_name, 
      
      // Joining specific info
      dateOfJoining: joiningDetails?.dateOfJoining || null,
      
      // Previous employments
      previousEmployments: previousEmploymentResult.rows.length > 0 
        ? previousEmploymentResult.rows 
        : [{
            id: 1,
            companyName: "",
            startDate: "",
            endDate: "",
            designation: "",
            offerLetter: "",
            releavingLetter: "",
            paySlips: ""
          }]
    };
    
    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching joining details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching joining details',
      error: error.message
    });
  }
};

// Update joining details
exports.updateJoiningDetails = async (req, res) => {
  try {
    const joiningDetails = await JoiningDetails.update(req.params.id, req.body);
    if (!joiningDetails) {
      return res.status(404).json({
        success: false,
        message: 'Joining details not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Joining details updated successfully',
      data: joiningDetails
    });
  } catch (error) {
    console.error('Error updating joining details:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating joining details',
      error: error.message
    });
  }
};

// Delete joining details
exports.deleteJoiningDetails = async (req, res) => {
  try {
    const joiningDetails = await JoiningDetails.delete(req.params.id);
    if (!joiningDetails) {
      return res.status(404).json({
        success: false,
        message: 'Joining details not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Joining details deleted successfully',
      data: joiningDetails
    });
  } catch (error) {
    console.error('Error deleting joining details:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting joining details',
      error: error.message
    });
  }
};