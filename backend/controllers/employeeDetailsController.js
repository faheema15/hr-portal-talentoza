// backend/controllers/employeeDetailsController.js
const EmployeeDetails = require('../models/EmployeeDetails');
const pool = require('../config/database');

// Create new employee - ONLY emp_id and role
exports.createEmployee = async (req, res) => {
  const client = await pool.connect();
  
  try {
    console.log('Creating employee with data:', req.body);
    
    await client.query('BEGIN');
    
    // Get emp_id, role, and additional fields from request
    const { emp_id, user_role, full_name, email, designation, department_id, reporting_manager_id } = req.body;

    // Validate required fields
    if (!emp_id || !user_role || !full_name || !email || !designation) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Employee ID, Role, Name, Email, and Designation are required'
      });
    }
    
    // Check if emp_id already exists in employee_details
    const empCheck = await client.query(
      'SELECT emp_id FROM employee_details WHERE emp_id = $1',
      [emp_id]
    );
    
    if (empCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'Employee ID already exists'
      });
    }
    
    // Create employee record WITHOUT user_id (will be linked during signup)
    const employeeQuery = `
      INSERT INTO employee_details (emp_id, full_name, email1, designation, department_id, reporting_manager_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const employeeResult = await client.query(employeeQuery, [
      emp_id, 
      full_name, 
      email, 
      designation, 
      department_id || null, 
      reporting_manager_id || null
    ]);
    const employee = employeeResult.rows[0];
    
    // Store role temporarily in a separate table or use a different approach
    // For now, we'll store it in a JSON field or create a temp table
    // Let's create a pending_signups table entry
    await client.query(
      'INSERT INTO pending_signups (emp_id, full_name, email, assigned_role, designation) VALUES ($1, $2, $3, $4, $5)',
      [emp_id, full_name, email, user_role, designation]
    );
  
    
    // Auto-create related records
    await client.query(
      'INSERT INTO joining_details (emp_id, date_of_joining) VALUES ($1, $2)',
      [emp_id, new Date()]
    );
    
    await client.query(
      'INSERT INTO bank_details (emp_id, start_date, is_primary) VALUES ($1, $2, $3)',
      [emp_id, new Date(), true]
    );
    
    await client.query(
      'INSERT INTO bgv (emp_id, status, remarks) VALUES ($1, $2, $3)',
      [emp_id, 'Yellow', 'Pending verification']
    );
    
    const currentYear = new Date().getFullYear();
    const leaveTypes = [
      { type: 'Casual', allocated: 12 },
      { type: 'Sick', allocated: 10 },
      { type: 'Earned', allocated: 15 }
    ];
    
    for (const leave of leaveTypes) {
      await client.query(
        'INSERT INTO leave_types (emp_id, leave_type, allocated, consumed, remaining, year) VALUES ($1, $2, $3, $4, $5, $6)',
        [emp_id, leave.type, leave.allocated, 0, leave.allocated, currentYear]
      );
    }
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    await client.query(
      'INSERT INTO salary (emp_id, salary_month, basic_salary, gross_salary, net_salary, remarks) VALUES ($1, $2, $3, $4, $5, $6)',
      [emp_id, currentMonth, 0, 0, 0, 'Initial record - to be updated']
    );
    
    await client.query(
      'INSERT INTO insurance (emp_id, status, remarks) VALUES ($1, $2, $3)',
      [emp_id, 'Active', 'Not enrolled yet']
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'Employee ID created successfully',
      data: {
        emp_id: employee.emp_id,
        role: user_role
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating employee:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Employee ID already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating employee',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await EmployeeDetails.findAll();
    
    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await EmployeeDetails.findByEmpId(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee',
      error: error.message
    });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const existingEmployee = await EmployeeDetails.findByEmpId(req.params.id);
    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    const employee = await EmployeeDetails.update(req.params.id, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating employee',
      error: error.message
    });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await EmployeeDetails.delete(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully',
      data: employee
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting employee',
      error: error.message
    });
  }
};