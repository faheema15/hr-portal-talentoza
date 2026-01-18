//backend/routes/teamsRoutes.js
const express = require('express');
const router = express.Router();
const teamsController = require('../controllers/teamsController');

// Get all teams
router.get('/', teamsController.getAllTeams);

// Get employees for dropdown
router.get('/employees', teamsController.getEmployees);

// Get projects for dropdown
router.get('/projects', teamsController.getProjects);

// Get team by ID with full details
router.get('/:id', teamsController.getTeamById);

// Create new team
router.post('/', teamsController.createTeam);

// Update team
router.put('/:id', teamsController.updateTeam);

// Delete team
router.delete('/:id', teamsController.deleteTeam);

// Add team member
router.post('/:team_id/members', teamsController.addTeamMember);

// Remove team member
router.delete('/:team_id/members/:emp_id', teamsController.removeTeamMember);

// Add project to team
router.post('/:team_id/projects', teamsController.addProjectToTeam);

// Remove project from team
router.delete('/:team_id/projects/:project_id', teamsController.removeProjectFromTeam);

module.exports = router;