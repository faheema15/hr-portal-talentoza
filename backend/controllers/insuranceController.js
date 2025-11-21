const Insurance = require('../models/Insurance');

// Create new insurance record
exports.createInsurance = async (req, res) => {
  try {
    const insurance = await Insurance.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Insurance record created successfully',
      data: insurance
    });
  } catch (error) {
    console.error('Error creating insurance record:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating insurance record',
      error: error.message
    });
  }
};

// Get all insurance records
exports.getAllInsurance = async (req, res) => {
  try {
    const insurance = await Insurance.findAll();
    res.status(200).json({
      success: true,
      data: insurance
    });
  } catch (error) {
    console.error('Error fetching insurance records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insurance records',
      error: error.message
    });
  }
};

// Get insurance by employee ID
exports.getInsuranceById = async (req, res) => {
  try {
    const insurance = await Insurance.findByEmpId(req.params.id);
    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: 'Insurance record not found'
      });
    }
    res.status(200).json({
      success: true,
      data: insurance
    });
  } catch (error) {
    console.error('Error fetching insurance record:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insurance record',
      error: error.message
    });
  }
};

// Get insurance history by employee ID
exports.getInsuranceHistory = async (req, res) => {
  try {
    const insurance = await Insurance.findAllByEmpId(req.params.id);
    res.status(200).json({
      success: true,
      data: insurance
    });
  } catch (error) {
    console.error('Error fetching insurance history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insurance history',
      error: error.message
    });
  }
};

// Get insurance by policy number
exports.getInsuranceByPolicyNumber = async (req, res) => {
  try {
    const insurance = await Insurance.findByPolicyNumber(req.params.policyNumber);
    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: 'Insurance policy not found'
      });
    }
    res.status(200).json({
      success: true,
      data: insurance
    });
  } catch (error) {
    console.error('Error fetching insurance by policy number:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insurance by policy number',
      error: error.message
    });
  }
};

// Get insurance by status
exports.getInsuranceByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const insurance = await Insurance.findByStatus(status);
    res.status(200).json({
      success: true,
      data: insurance
    });
  } catch (error) {
    console.error('Error fetching insurance by status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insurance by status',
      error: error.message
    });
  }
};

// Get expiring policies
exports.getExpiringPolicies = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const insurance = await Insurance.findExpiringPolicies(days);
    res.status(200).json({
      success: true,
      message: `Policies expiring in next ${days} days`,
      data: insurance
    });
  } catch (error) {
    console.error('Error fetching expiring policies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expiring policies',
      error: error.message
    });
  }
};

// Get expired policies
exports.getExpiredPolicies = async (req, res) => {
  try {
    const insurance = await Insurance.findExpiredPolicies();
    res.status(200).json({
      success: true,
      data: insurance
    });
  } catch (error) {
    console.error('Error fetching expired policies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expired policies',
      error: error.message
    });
  }
};

// Update insurance record
exports.updateInsurance = async (req, res) => {
  try {
    const insurance = await Insurance.update(req.params.id, req.body);
    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: 'Insurance record not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Insurance record updated successfully',
      data: insurance
    });
  } catch (error) {
    console.error('Error updating insurance record:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating insurance record',
      error: error.message
    });
  }
};

// Update policy status
exports.updateInsuranceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['Active', 'Expired', 'Pending', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (Active, Expired, Pending, Cancelled)'
      });
    }

    const insurance = await Insurance.updateStatus(req.params.id, status);
    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: 'Insurance record not found'
      });
    }
    res.status(200).json({
      success: true,
      message: `Insurance status updated to ${status}`,
      data: insurance
    });
  } catch (error) {
    console.error('Error updating insurance status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating insurance status',
      error: error.message
    });
  }
};

// Delete insurance record
exports.deleteInsurance = async (req, res) => {
  try {
    const insurance = await Insurance.delete(req.params.id);
    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: 'Insurance record not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Insurance record deleted successfully',
      data: insurance
    });
  } catch (error) {
    console.error('Error deleting insurance record:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting insurance record',
      error: error.message
    });
  }
};

// Get insurance summary
exports.getInsuranceSummary = async (req, res) => {
  try {
    const summary = await Insurance.getSummary(req.params.id);
    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'Insurance summary not found'
      });
    }
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching insurance summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insurance summary',
      error: error.message
    });
  }
};

// Get insurance statistics
exports.getInsuranceStatistics = async (req, res) => {
  try {
    const stats = await Insurance.getStatistics();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching insurance statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insurance statistics',
      error: error.message
    });
  }
};

// Get expiring policies with employee details
exports.getExpiringPoliciesWithDetails = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const policies = await Insurance.getExpiringPoliciesWithDetails(days);
    res.status(200).json({
      success: true,
      message: `Policies expiring in next ${days} days with employee details`,
      data: policies
    });
  } catch (error) {
    console.error('Error fetching expiring policies with details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expiring policies with details',
      error: error.message
    });
  }
};