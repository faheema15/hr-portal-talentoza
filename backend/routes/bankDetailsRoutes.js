const express = require('express');
const router = express.Router();
const bankDetailsController = require('../controllers/bankDetailsController');

// Create new bank details
router.post('/', bankDetailsController.createBankDetails);

// Get all bank details
router.get('/', bankDetailsController.getAllBankDetails);

// Get statistics
router.get('/statistics', bankDetailsController.getStatistics);

// Get bank-wise summary
router.get('/summary/banks', bankDetailsController.getBankWiseSummary);

// Get employees with incomplete bank details
router.get('/incomplete', bankDetailsController.getIncompleteBankDetails);

// Get employees by bank name
router.get('/bank/:bankName', bankDetailsController.getEmployeesByBank);

// Get employees by IFSC code
router.get('/ifsc/:ifscCode', bankDetailsController.getEmployeesByIFSC);

// Search by PAN number
router.get('/pan/:panNumber', bankDetailsController.searchByPAN);

// Search by Aadhar number
router.get('/aadhar/:aadharNumber', bankDetailsController.searchByAadhar);

// Get bank details by account number
router.get('/account/:accountNumber', bankDetailsController.getBankDetailsByAccountNumber);

// Verify bank details completeness
router.get('/:id/verify', bankDetailsController.verifyCompleteness);

// Get bank details by employee ID
router.get('/:id', bankDetailsController.getBankDetailsById);

// Update bank details
router.put('/:id', bankDetailsController.updateBankDetails);

// Update only banking information
router.patch('/:id/banking', bankDetailsController.updateBankingInfo);

// Delete bank details
router.delete('/:id', bankDetailsController.deleteBankDetails);

module.exports = router;