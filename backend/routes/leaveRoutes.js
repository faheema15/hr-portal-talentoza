// backend/routes/leaveRoutes.js
const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');

// Create new leave record (triggers email)
router.post('/', leaveController.createLeave);

// Get all leave records
router.get('/', leaveController.getAllLeaves);

// Get pending leave requests
router.get('/pending', leaveController.getPendingLeaves);

// Get leave requests by status (Approved, Rejected, Pending)
router.get('/status/:status', leaveController.getLeavesByStatus);

// Leave history (must come before /:id)
router.get('/leave-list/:id', leaveController.getLeaveHistory);

// Get leave by employee ID
router.get('/:id', leaveController.getLeaveById);

// Get leave history by employee ID (alternative route)
router.get('/:id/history', leaveController.getLeaveHistory);

// Get leave requests by date range
router.get('/:id/daterange', leaveController.getLeavesByDateRange);

// Get leave balance
router.get('/:id/balance', leaveController.getLeaveBalance);

// Get leave statistics
router.get('/:id/statistics', leaveController.getLeaveStatistics);

// **FIX: Use updateLeaveStatus for status updates (this should come BEFORE the generic /:id route)**
router.put('/:id/status', leaveController.updateLeaveStatus);

// **CHANGE THIS: Update to use updateLeaveStatus instead of updateLeave**
router.put('/:id', leaveController.updateLeaveStatus);

// Delete leave record
router.delete('/:id', leaveController.deleteLeave);

module.exports = router;