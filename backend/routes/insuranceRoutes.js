const express = require('express');
const router = express.Router();
const insuranceController = require('../controllers/insuranceController');

// Create new insurance record
router.post('/', insuranceController.createInsurance);

// Get all insurance records
router.get('/', insuranceController.getAllInsurance);

// Get insurance statistics
router.get('/statistics', insuranceController.getInsuranceStatistics);

// Get expiring policies
router.get('/expiring', insuranceController.getExpiringPolicies);

// Get expiring policies with employee details
router.get('/expiring/details', insuranceController.getExpiringPoliciesWithDetails);

// Get expired policies
router.get('/expired', insuranceController.getExpiredPolicies);

// Get insurance by status (Active, Expired, Pending, Cancelled)
router.get('/status/:status', insuranceController.getInsuranceByStatus);

// Get insurance by policy number
router.get('/policy/:policyNumber', insuranceController.getInsuranceByPolicyNumber);

// Get insurance by employee ID
router.get('/:id', insuranceController.getInsuranceById);

// Get insurance history by employee ID
router.get('/:id/history', insuranceController.getInsuranceHistory);

// Get insurance summary
router.get('/:id/summary', insuranceController.getInsuranceSummary);

// Update insurance record
router.put('/:id', insuranceController.updateInsurance);

// Update insurance status only
router.patch('/:id/status', insuranceController.updateInsuranceStatus);

// Delete insurance record
router.delete('/:id', insuranceController.deleteInsurance);

module.exports = router;