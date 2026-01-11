// backend/routes/index.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Import route modules
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
const offerLetterRoutes = require('./offerLetterRoutes');
const uploadRoutes = require('./uploadRoutes');


// Public routes (NO authentication required)
router.use('/auth', authRoutes);

// Protected routes (authentication REQUIRED)
router.use('/employee-details', authController.verifyToken, employeeDetailsRoutes);
router.use('/departments', authController.verifyToken, departmentRoutes);
router.use('/teams', authController.verifyToken, teamsRoutes);
router.use('/projects', authController.verifyToken, projectRoutes);
router.use('/education', authController.verifyToken, educationRoutes);
router.use('/certifications', authController.verifyToken, certificationRoutes);
router.use('/research-papers', authController.verifyToken, researchPaperRoutes);
router.use('/joining-details', authController.verifyToken, joiningDetailsRoutes);
router.use('/leave', authController.verifyToken, leaveRoutes);
router.use('/salary', authController.verifyToken, salaryRoutes);
router.use('/bank-details', authController.verifyToken, bankDetailsRoutes);
router.use('/bgv', authController.verifyToken, bgvRoutes);
router.use('/attendance', authController.verifyToken, attendanceRoutes);
router.use('/insurance', authController.verifyToken, insuranceRoutes);
router.use('/offer-letters', authController.verifyToken, offerLetterRoutes);
router.use('/upload', authController.verifyToken, uploadRoutes);

module.exports = router;