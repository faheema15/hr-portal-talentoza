const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// Employee attendance setup routes
router.post('/', attendanceController.createAttendance);
router.get('/', attendanceController.getAllAttendance);
router.get('/:id', attendanceController.getAttendanceById);
router.put('/:id', attendanceController.updateAttendance);
router.delete('/:id', attendanceController.deleteAttendance);

// Attendance records routes
router.post('/records', attendanceController.createAttendanceRecord);
router.post('/records/bulk', attendanceController.createBulkAttendanceRecords);
router.get('/:id/records', attendanceController.getAttendanceRecords);
router.get('/:id/monthly', attendanceController.getMonthlyAttendance);
router.get('/:id/summary', attendanceController.getAttendanceSummary);

// Mark today's attendance
router.post('/:id/mark-today', attendanceController.markTodayAttendance);

// Reports and analytics
router.get('/reports/daily', attendanceController.getDailyAttendanceReport);
router.get('/reports/department', attendanceController.getDepartmentAttendanceSummary);
router.get('/reports/low-attendance', attendanceController.getLowAttendanceEmployees);

module.exports = router;