const express = require('express');
const router = express.Router();
const employeeDetailsController = require('../controllers/employeeDetailsController');

// Create new employee
router.post('/', employeeDetailsController.createEmployee);

// Get all employees
router.get('/', employeeDetailsController.getAllEmployees);

// Get employee by ID
router.get('/:id', employeeDetailsController.getEmployeeById);

// Update employee
router.put('/:id', employeeDetailsController.updateEmployee);

// Delete employee
router.delete('/:id', employeeDetailsController.deleteEmployee);

module.exports = router;