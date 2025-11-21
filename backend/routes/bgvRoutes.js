const express = require('express');
const router = express.Router();
const bgvController = require('../controllers/bgvController');

// Create new BGV record
router.post('/', bgvController.createBGV);

// Get all BGV records
router.get('/', bgvController.getAllBGV);

// Get BGV statistics
router.get('/statistics', bgvController.getBGVStatistics);

// Get department-wise summary
router.get('/summary/departments', bgvController.getDepartmentWiseSummary);

// Get pending BGV records
router.get('/pending', bgvController.getPendingBGV);

// Get failed BGV records
router.get('/failed', bgvController.getFailedBGV);

// Get employees with BGV issues
router.get('/issues', bgvController.getEmployeesWithIssues);

// Get BGV records by status (Green, Yellow, Red)
router.get('/status/:status', bgvController.getBGVByStatus);

// Get BGV records by department
router.get('/department/:department', bgvController.getBGVByDepartment);

// Get BGV statistics by department
router.get('/statistics/department/:department', bgvController.getBGVStatisticsByDepartment);

// Get BGV by employee ID
router.get('/:id', bgvController.getBGVById);

// Update BGV record
router.put('/:id', bgvController.updateBGV);

// Update BGV status only
router.patch('/:id/status', bgvController.updateBGVStatus);

// Delete BGV record
router.delete('/:id', bgvController.deleteBGV);

module.exports = router;