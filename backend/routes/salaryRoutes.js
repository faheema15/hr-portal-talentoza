const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');

// Create new salary record
router.post('/', salaryController.createSalary);

// Get all salary records
router.get('/', salaryController.getAllSalaries);

// Get salary by employee ID
router.get('/:id', salaryController.getSalaryById);

// Get salary history by employee ID
router.get('/:id/history', salaryController.getSalaryHistory);

// Get salary by month
router.get('/:id/month/:month', salaryController.getSalaryByMonth);

// Get salary statistics
router.get('/:id/statistics', salaryController.getSalaryStatistics);

// Update salary
router.put('/:id', salaryController.updateSalary);

// Delete salary
router.delete('/:id', salaryController.deleteSalary);

module.exports = router;