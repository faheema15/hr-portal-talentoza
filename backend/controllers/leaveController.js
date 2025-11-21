//backend/controllers/leaveController.js
const Leave = require('../models/Leave');

// Create new leave record
exports.createLeave = async (req, res) => {
  try {
    const leave = await Leave.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Leave record created successfully',
      data: leave
    });
  } catch (error) {
    console.error('Error creating leave record:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating leave record',
      error: error.message
    });
  }
};

// Get all leave records
exports.getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.findAll();
    res.status(200).json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error('Error fetching leave records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave records',
      error: error.message
    });
  }
};

// Get leave by employee ID
exports.getLeaveById = async (req, res) => {
  try {
    const leave = await Leave.findByEmpId(req.params.id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave record not found'
      });
    }
    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (error) {
    console.error('Error fetching leave record:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave record',
      error: error.message
    });
  }
};

// Get leave history by employee ID
exports.getLeaveHistory = async (req, res) => {
  try {
    const leaves = await Leave.findAllByEmpId(req.params.id);
    res.status(200).json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error('Error fetching leave history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave history',
      error: error.message
    });
  }
};

// Get pending leave requests
exports.getPendingLeaves = async (req, res) => {
  try {
    const leaves = await Leave.findPendingLeaves();
    res.status(200).json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error('Error fetching pending leaves:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending leaves',
      error: error.message
    });
  }
};

// Get leave requests by status
exports.getLeavesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const leaves = await Leave.findByStatus(status);
    res.status(200).json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error('Error fetching leaves by status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaves by status',
      error: error.message
    });
  }
};

// Get leave requests by date range
exports.getLeavesByDateRange = async (req, res) => {
  try {
    const { id } = req.params;
    const { fromDate, toDate } = req.query;
    
    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: 'fromDate and toDate are required'
      });
    }

    const leaves = await Leave.findByDateRange(id, fromDate, toDate);
    res.status(200).json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error('Error fetching leaves by date range:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaves by date range',
      error: error.message
    });
  }
};

// Update leave record
exports.updateLeave = async (req, res) => {
  try {
    const leave = await Leave.update(req.params.id, req.body);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave record not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Leave record updated successfully',
      data: leave
    });
  } catch (error) {
    console.error('Error updating leave record:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating leave record',
      error: error.message
    });
  }
};

// Update leave status
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (Pending, Approved, Rejected)'
      });
    }

    const leave = await Leave.updateStatus(req.params.id, status);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave record not found'
      });
    }
    res.status(200).json({
      success: true,
      message: `Leave status updated to ${status}`,
      data: leave
    });
  } catch (error) {
    console.error('Error updating leave status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating leave status',
      error: error.message
    });
  }
};

// Delete leave record
exports.deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.delete(req.params.id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave record not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Leave record deleted successfully',
      data: leave
    });
  } catch (error) {
    console.error('Error deleting leave record:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting leave record',
      error: error.message
    });
  }
};

// Get leave balance
exports.getLeaveBalance = async (req, res) => {
  try {
    const balance = await Leave.getLeaveBalance(req.params.id);
    if (!balance) {
      return res.status(404).json({
        success: false,
        message: 'Leave balance not found'
      });
    }
    res.status(200).json({
      success: true,
      data: balance
    });
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave balance',
      error: error.message
    });
  }
};

// Get leave statistics
exports.getLeaveStatistics = async (req, res) => {
  try {
    const stats = await Leave.getLeaveStatistics(req.params.id);
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching leave statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave statistics',
      error: error.message
    });
  }
};