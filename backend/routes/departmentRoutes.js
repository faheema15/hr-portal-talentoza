// backend/routes/departmentRoutes.js
const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');

// GET all departments
router.get('/', departmentController.getAllDepartments);

// GET potential department heads
router.get('/potential-heads', departmentController.getPotentialHeads);

router.get('/:id/members', departmentController.getDepartmentMembers);

// GET single department by ID
router.get('/:id', departmentController.getDepartmentById);

// POST create new department
router.post('/', departmentController.createDepartment);

// PUT update department
router.put('/:id', departmentController.updateDepartment);

// DELETE department
router.delete('/:id', departmentController.deleteDepartment);

module.exports = router;