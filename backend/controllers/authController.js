// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Signup - Complete registration using Employee ID
exports.signup = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { emp_id, password } = req.body;

    console.log('Signup attempt with:', { emp_id });

    // Validate required fields
    if (!emp_id || !password) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and password are required'
      });
    }
    
    await client.query('BEGIN');
    
    // Check if employee ID exists in employee_details
    const empCheck = await client.query(
      'SELECT emp_id, user_id FROM employee_details WHERE emp_id = $1',
      [emp_id]
    );
    
    if (empCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Invalid Employee ID. Please contact HR.'
      });
    }
    
    const employee = empCheck.rows[0];
    
    // Check if this employee ID is already linked to a user account
    if (employee.user_id) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'This Employee ID is already registered. Please use the login page.'
      });
    }
    
    // Get the assigned role, name, and email from pending_signups
    const roleCheck = await client.query(
      'SELECT assigned_role, full_name, email FROM pending_signups WHERE emp_id = $1',
      [emp_id]
    );

    if (roleCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Employee ID not found in pending signups. Please contact HR.'
      });
    }

    const { assigned_role, full_name, email } = roleCheck.rows[0];
    
    // NOW check if email already exists in users table (after email is defined)
    const emailCheck = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (emailCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'This email is already registered'
      });
    }
    
    // Hash password
    const hashed_password = await bcrypt.hash(password, 10);
    
    // Create user account
    const userQuery = `
      INSERT INTO users (name, email, password, role, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, role, is_active, created_at
    `;
    
    const userResult = await client.query(userQuery, [
      full_name,
      email,
      hashed_password,
      assigned_role,
      true
    ]);
    
    const user = userResult.rows[0];
    
    // Link user account to employee record
    await client.query(
      'UPDATE employee_details SET user_id = $1 WHERE emp_id = $2',
      [user.id, emp_id]
    );
    
    // Remove from pending_signups
    await client.query(
      'DELETE FROM pending_signups WHERE emp_id = $1',
      [emp_id]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully! You can now login.',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
        emp_id: emp_id
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating account',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔍 Login attempt:', { email, password_length: password?.length });
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Find user by email
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    
    console.log('📊 User found:', result.rows.length > 0 ? 'YES' : 'NO');
    
    if (result.rows.length === 0) {
      console.log('❌ No user found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    const user = result.rows[0];
    console.log('👤 User data:', { id: user.id, email: user.email, role: user.role });
    
    // Check if user is active
    if (!user.is_active) {
      console.log('⚠️ User is inactive');
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact HR.'
      });
    }
    
    // Verify password
    console.log('🔐 Comparing passwords...');
    console.log('   Password provided:', password);
    console.log('   Hash in DB:', user.password);
    
    const is_valid = await bcrypt.compare(password, user.password);
    
    console.log('✅ Password match result:', is_valid);
    
    if (!is_valid) {
      console.log('❌ Password does not match');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Get employee ID if exists
    const empQuery = 'SELECT emp_id FROM employee_details WHERE user_id = $1';
    const empResult = await pool.query(empQuery, [user.id]);
    const emp_id = empResult.rows.length > 0 ? empResult.rows[0].emp_id : null;
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        name: user.name,
        emp_id: emp_id 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('🎫 Token generated successfully');
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          emp_id: emp_id
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
};

// Verify Token Middleware
exports.verifyToken = (req, res, next) => {
  try {
    // Get token from header
    const auth_header = req.headers.authorization;

    if (!auth_header) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Extract token from "Bearer <token>"
    const token = auth_header.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error verifying token',
      error: error.message
    });
  }
};

// Verify Role Middleware
exports.verifyRole = (allowed_roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!allowed_roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Get current user info
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT u.id, u.name, u.email, u.role, ed.emp_id
      FROM users u
      LEFT JOIN employee_details ed ON u.id = ed.user_id
      WHERE u.id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message
    });
  }
};

module.exports = exports;