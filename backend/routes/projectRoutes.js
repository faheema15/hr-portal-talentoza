// backend/routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// GET all projects (role-based)
router.get('/', projectController.getAllProjects);

// GET all employees (for assignment)
router.get('/employees', projectController.getAllEmployees);

// GET potential project managers
router.get('/potential-managers', projectController.getPotentialManagers);

// GET single project by ID with members
router.get('/:id', projectController.getProjectById);

// POST create new project
router.post('/', projectController.createProject);

// PUT update project
router.put('/:id', projectController.updateProject);

// DELETE project
router.delete('/:id', projectController.deleteProject);

// POST assign employee to project
router.post('/assign-employee', projectController.assignEmployee);

// DELETE remove employee from project
router.delete('/assignments/:assignmentId', projectController.removeEmployee);

module.exports = router;