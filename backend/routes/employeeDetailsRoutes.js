const express = require('express');
const router = express.Router();
const employeeDetailsController = require('../controllers/employeeDetailsController');

const {
  getAllEmployees,
  getFullEmployeeDetails
} = require("../controllers/employeeDetailsController");

// Create new employee
router.post('/', employeeDetailsController.createEmployee);


router.get('/all', getAllEmployees);
router.get('/active/list', employeeDetailsController.getActiveEmployees);
router.get('/hr/list', employeeDetailsController.getAllEmployeesForHR);
router.get('/full/:id', getFullEmployeeDetails);

// Soft Delete employee
router.put('/soft-delete/:id', employeeDetailsController.deleteEmployee);

// Get employee by ID 
router.get('/:id', employeeDetailsController.getEmployeeById);

// Update employee
router.put('/:id', employeeDetailsController.updateEmployee);

// Default get all
router.get('/', employeeDetailsController.getAllEmployees);

module.exports = router;