const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// ==================== SPECIFIC ROUTES FIRST ====================
router.get('/reports/daily', attendanceController.getDailyAttendanceReport);
router.get('/reports/department', attendanceController.getDepartmentAttendanceSummary);
router.get('/reports/low-attendance', attendanceController.getLowAttendanceEmployees);

// ==================== HOLIDAYS ====================
router.get('/holidays', attendanceController.getGovernmentHolidays);

// ==================== INITIALIZATION (BEFORE :id routes) ====================
router.post('/initialize/all', attendanceController.initializeMonthlyAttendance);
router.post('/initialize/:id', attendanceController.initializeEmployeeAttendance);

// ==================== MAIN ROUTES ====================
router.post('/', attendanceController.createAttendance);
router.get('/', attendanceController.getAllAttendance);

// ==================== RECORDS ====================
router.post('/records/bulk', attendanceController.createBulkAttendanceRecords);
router.post('/records', attendanceController.createAttendanceRecord);

// ==================== EMPLOYEE-SPECIFIC (LAST) ====================
router.post('/:id/mark-today', attendanceController.markTodayAttendance);
router.get('/:id/records', attendanceController.getAttendanceRecords);
router.get('/:id/monthly', attendanceController.getMonthlyAttendance);
router.get('/:id/summary', attendanceController.getAttendanceSummary);
router.get('/:id', attendanceController.getAttendanceById);
router.put('/:id', attendanceController.updateAttendance);
router.delete('/:id', attendanceController.deleteAttendance);

module.exports = router;