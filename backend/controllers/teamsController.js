//backend/controllers/teamsController.js
const teamsModel = require('../models/teams');

const teamsController = {
  // Get all teams
  getAllTeams: async (req, res) => {
    try {
      const teams = await teamsModel.getAllTeams();
      
      res.status(200).json({
        success: true,
        data: teams
      });
    } catch (error) {
      console.error('Error fetching teams:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching teams',
        error: error.message
      });
    }
  },

  // Get team by ID with full details
  getTeamById: async (req, res) => {
    try {
      const { id } = req.params;
      const team = await teamsModel.getTeamById(id);

      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      res.status(200).json({
        success: true,
        data: team
      });
    } catch (error) {
      console.error('Error fetching team details:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching team details',
        error: error.message
      });
    }
  },

  // Create new team
  createTeam: async (req, res) => {
    try {
      const { team_name, team_head_id, project_id } = req.body;

      // Validation
      if (!team_name || team_name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Team name is required'
        });
      }

      const newTeam = await teamsModel.createTeam({
        team_name: team_name.trim(),
        team_head_id,
        project_id
      });

      res.status(201).json({
        success: true,
        message: 'Team created successfully',
        data: newTeam
      });
    } catch (error) {
      console.error('Error creating team:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating team',
        error: error.message
      });
    }
  },

  // Update team
  updateTeam: async (req, res) => {
    try {
      const { id } = req.params;
      const { team_name, team_head_id, project_id } = req.body;

      // Validation
      if (!team_name || team_name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Team name is required'
        });
      }

      const updatedTeam = await teamsModel.updateTeam(id, {
        team_name: team_name.trim(),
        team_head_id,
        project_id
      });

      if (!updatedTeam) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Team updated successfully',
        data: updatedTeam
      });
    } catch (error) {
      console.error('Error updating team:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating team',
        error: error.message
      });
    }
  },

  // Delete team
  deleteTeam: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedTeam = await teamsModel.deleteTeam(id);

      if (!deletedTeam) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Team deleted successfully',
        data: deletedTeam
      });
    } catch (error) {
      console.error('Error deleting team:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting team',
        error: error.message
      });
    }
  },

  // Get employees for dropdown
  getEmployees: async (req, res) => {
    try {
      const employees = await teamsModel.getAllEmployees();
      
      res.status(200).json({
        success: true,
        data: employees
      });
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching employees',
        error: error.message
      });
    }
  },

  // Get projects for dropdown
  getProjects: async (req, res) => {
    try {
      const projects = await teamsModel.getAllProjects();
      
      res.status(200).json({
        success: true,
        data: projects
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching projects',
        error: error.message
      });
    }
  },

  // Add team member
  addTeamMember: async (req, res) => {
    try {
      const { team_id } = req.params;
      const { emp_id, role_in_team, start_date, end_date } = req.body;

      if (!emp_id) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID is required'
        });
      }

      const member = await teamsModel.addTeamMember({
        team_id,
        emp_id,
        role_in_team,
        start_date,
        end_date
      });

      res.status(201).json({
        success: true,
        message: 'Team member added successfully',
        data: member
      });
    } catch (error) {
      console.error('Error adding team member:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding team member',
        error: error.message
      });
    }
  },

  // Remove team member
  removeTeamMember: async (req, res) => {
    try {
      const { team_id, emp_id } = req.params;

      const removedMember = await teamsModel.removeTeamMember(team_id, emp_id);

      if (!removedMember) {
        return res.status(404).json({
          success: false,
          message: 'Team member not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Team member removed successfully',
        data: removedMember
      });
    } catch (error) {
      console.error('Error removing team member:', error);
      res.status(500).json({
        success: false,
        message: 'Error removing team member',
        error: error.message
      });
    }
  },

  // Add project to team
  addProjectToTeam: async (req, res) => {
    try {
      const { team_id } = req.params;
      const { project_id, start_date, end_date, role_in_project } = req.body;

      if (!project_id) {
        return res.status(400).json({
          success: false,
          message: 'Project ID is required'
        });
      }

      const project = await teamsModel.addProjectToTeam({
        team_id,
        project_id,
        start_date,
        end_date,
        role_in_project
      });

      res.status(201).json({
        success: true,
        message: 'Project added to team successfully',
        data: project
      });
    } catch (error) {
      console.error('Error adding project to team:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding project to team',
        error: error.message
      });
    }
  },

  // Remove project from team
  removeProjectFromTeam: async (req, res) => {
    try {
      const { team_id, project_id } = req.params;

      const removedProject = await teamsModel.removeProjectFromTeam(team_id, project_id);

      if (!removedProject) {
        return res.status(404).json({
          success: false,
          message: 'Project assignment not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Project removed from team successfully',
        data: removedProject
      });
    } catch (error) {
      console.error('Error removing project from team:', error);
      res.status(500).json({
        success: false,
        message: 'Error removing project from team',
        error: error.message
      });
    }
  }
};

module.exports = teamsController;