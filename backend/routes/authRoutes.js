// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ==================== PUBLIC ROUTES ====================

// Signup
router.post('/signup', authController.signup);

// Login
router.post('/login', authController.login);

// Forgot Password - Send reset link/token to email
// POST /api/auth/forgot-password
// Body: { emp_id, email }
router.post('/forgot-password', authController.forgotPassword);

// Reset Password - After receiving temporary password via email
// POST /api/auth/reset-password
// Body: { emp_id, email, tempPassword, newPassword, confirmPassword }
router.post('/reset-password', authController.resetPassword);

// ==================== PROTECTED ROUTES ====================

// Get current user info
router.get('/me', authController.verifyToken, authController.getCurrentUser);

// Change Password - For logged-in users
// POST /api/auth/change-password
// Body: { oldPassword, newPassword, confirmPassword }
// Header: Authorization: Bearer <token>
router.post(
  '/change-password',
  authController.verifyToken,
  authController.changePassword
);

module.exports = router;