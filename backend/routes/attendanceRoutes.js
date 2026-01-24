const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// ==================== REPORTS AND ANALYTICS (MUST BE FIRST) ====================
// These specific routes must come BEFORE /:id routes to avoid conflicts
router.get('/reports/daily', attendanceController.getDailyAttendanceReport);
router.get('/reports/department', attendanceController.getDepartmentAttendanceSummary);
router.get('/reports/low-attendance', attendanceController.getLowAttendanceEmployees);

// ==================== EMPLOYEE ATTENDANCE SETUP ROUTES ====================
router.post('/', attendanceController.createAttendance);
router.get('/', attendanceController.getAllAttendance);

// ==================== ATTENDANCE RECORDS ROUTES ====================
// Bulk operations first
router.post('/records/bulk', attendanceController.createBulkAttendanceRecords);
// Single record operations
router.post('/records', attendanceController.createAttendanceRecord);

// ==================== HOLIDAYS ROUTES ====================
router.get('/holidays', attendanceController.getGovernmentHolidays);

// ==================== INITIALIZATION ROUTES ====================
router.post('/initialize/all', attendanceController.initializeMonthlyAttendance);
router.post('/initialize/:id', attendanceController.initializeEmployeeAttendance);

// ==================== DYNAMIC ID ROUTES (MUST BE LAST) ====================
// Mark today's attendance
router.post('/:id/mark-today', attendanceController.markTodayAttendance);

// Get specific employee data
router.get('/:id/records', attendanceController.getAttendanceRecords);
router.get('/:id/monthly', attendanceController.getMonthlyAttendance);
router.get('/:id/summary', attendanceController.getAttendanceSummary);

// Update/Delete by ID
router.get('/:id', attendanceController.getAttendanceById);
router.put('/:id', attendanceController.updateAttendance);
router.delete('/:id', attendanceController.deleteAttendance);

module.exports = router;