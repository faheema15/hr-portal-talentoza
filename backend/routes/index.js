// backend/routes/index.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Import routes
const authRoutes = require('./authRoutes');
const employeeDetailsRoutes = require('./employeeDetailsRoutes');
const departmentRoutes = require('./departmentRoutes');
const teamsRoutes = require('./teamsRoutes');
const projectRoutes = require('./projectRoutes');
const educationRoutes = require('./educationRoutes');
const certificationRoutes = require('./certificationRoutes');
const researchPaperRoutes = require('./researchPaperRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const joiningDetailsRoutes = require('./joiningDetailsRoutes');
const leaveRoutes = require('./leaveRoutes');
const salaryRoutes = require('./salaryRoutes');
const bankDetailsRoutes = require('./bankDetailsRoutes');
const bgvRoutes = require('./bgvRoutes');
const insuranceRoutes = require('./insuranceRoutes');
const uploadRoutes = require('./uploadRoutes');

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/employee-details', authController.verifyToken, employeeDetailsRoutes);
router.use('/departments', authController.verifyToken, departmentRoutes);
router.use('/teams', authController.verifyToken, teamsRoutes);
router.use('/projects', authController.verifyToken, projectRoutes);
router.use('/education', authController.verifyToken, educationRoutes);
router.use('/certifications', authController.verifyToken, certificationRoutes);
router.use('/research-papers', authController.verifyToken, researchPaperRoutes);
router.use('/joining-details', authController.verifyToken, require('./joiningDetailsRoutes'));
router.use('/leave', authController.verifyToken, require('./leaveRoutes'));
router.use('/salary', authController.verifyToken, require('./salaryRoutes'));
router.use('/bank-details', authController.verifyToken, require('./bankDetailsRoutes'));
router.use('/bgv', authController.verifyToken, require('./bgvRoutes'));
router.use('/attendance', authController.verifyToken, require('./attendanceRoutes'));
router.use('/insurance', authController.verifyToken, require('./insuranceRoutes'));
router.use('/upload', uploadRoutes);

module.exports = router;