// backend/controllers/projectController.js
const Project = require('../models/Project');

const projectController = {
  // Get all projects based on user role
  getAllProjects: async (req, res) => {
    try {
      const { role, id } = req.user; // id is user_id from token
      let projects = [];

      if (role === 'HR' || role === 'SkipManager') {
        // HR and SkipManager see all projects
        projects = await Project.getAll();
      } else if (role === 'Manager') {
        // Manager sees only their projects
        projects = await Project.getByManagerId(id);
      } else if (role === 'Employee') {
        // Employee sees only projects they're assigned to
        // First get emp_id from user_id
        const db = require('../config/database');
        const empResult = await db.query('SELECT emp_id FROM employee_details WHERE user_id = $1', [id]);
        
        if (empResult.rows.length > 0) {
          const empId = empResult.rows[0].emp_id;
          projects = await Project.getByEmployeeId(empId);
        }
      }

      res.status(200).json({
        success: true,
        data: projects,
        message: 'Projects retrieved successfully'
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

  // Get project by ID with members
  getProjectById: async (req, res) => {
    try {
      const { id } = req.params;
      const project = await Project.getById(id);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check access rights
      const { role, id: userId } = req.user;
      
      if (role === 'Manager' && project.project_head_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only view your own projects'
        });
      }

      if (role === 'Employee') {
        // Check if employee is assigned to this project
        const db = require('../config/database');
        const empResult = await db.query('SELECT emp_id FROM employee_details WHERE user_id = $1', [userId]);
        
        if (empResult.rows.length > 0) {
          const empId = empResult.rows[0].emp_id;
          const checkAssignment = await db.query(
            'SELECT id FROM project_assignments WHERE project_id = $1 AND emp_id = $2',
            [id, empId]
          );
          
          if (checkAssignment.rows.length === 0) {
            return res.status(403).json({
              success: false,
              message: 'You do not have access to this project'
            });
          }
        }
      }

      // Get project members
      const members = await Project.getProjectMembers(id);

      res.status(200).json({
        success: true,
        data: {
          ...project,
          members
        },
        message: 'Project details retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching project',
        error: error.message
      });
    }
  },

  // Create new project
  createProject: async (req, res) => {
    try {
      const { project_name, start_date, end_date, status, manager_id } = req.body;

      // Validation
      if (!project_name || project_name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Project name is required'
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Project status is required'
        });
      }

      // Only HR and SkipManager can create projects
      if (!['HR', 'SkipManager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Only HR and Skip Manager can create projects'
        });
      }

      const newProject = await Project.create({
        project_name: project_name.trim(),
        start_date,
        end_date,
        status,
        manager_id: manager_id || null
      });

      res.status(201).json({
        success: true,
        data: newProject,
        message: 'Project created successfully'
      });
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating project',
        error: error.message
      });
    }
  },

  // Update project
  updateProject: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        project_name, 
        project_code,
        description,
        client_name,
        client_contact,
        start_date, 
        end_date, 
        budget,
        actual_cost,
        status, 
        priority,
        manager_id,
        technologies,
        remarks
      } = req.body;

      // Validation
      if (!project_name || project_name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Project name is required'
        });
      }

      // Check permissions
      const { role, id: userId } = req.user;
      
      if (role === 'Manager') {
        // Manager can only update their own projects
        const project = await Project.getById(id);
        if (project.project_head_id !== userId) {
          return res.status(403).json({
            success: false,
            message: 'You can only update your own projects'
          });
        }
      } else if (!['HR', 'SkipManager'].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update project'
        });
      }

      const updatedProject = await Project.update(id, {
        project_name: project_name.trim(),
        project_code: project_code || null,
        description: description || null,
        client_name: client_name || null,
        client_contact: client_contact || null,
        start_date: start_date || null,
        end_date: end_date || null,
        budget: budget || null,
        actual_cost: actual_cost || null,
        status,
        priority: priority || 'Medium',
        manager_id: manager_id || null,
        technologies: technologies || null,
        remarks: remarks || null
      });

      if (!updatedProject) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      res.status(200).json({
        success: true,
        data: updatedProject,
        message: 'Project updated successfully'
      });
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating project',
        error: error.message
      });
    }
  },

  // Delete project
  deleteProject: async (req, res) => {
    try {
      const { id } = req.params;

      // Only HR can delete projects
      if (req.user.role !== 'HR') {
        return res.status(403).json({
          success: false,
          message: 'Only HR can delete projects'
        });
      }

      const deletedProject = await Project.delete(id);

      if (!deletedProject) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting project',
        error: error.message
      });
    }
  },

  // Assign employee to project
  assignEmployee: async (req, res) => {
    try {
      const { project_id, emp_id, role_in_project, start_date, end_date, allocation_percent } = req.body;

      // Validation
      if (!project_id || !emp_id) {
        return res.status(400).json({
          success: false,
          message: 'Project ID and Employee ID are required'
        });
      }

      // Check permissions
      const { role, id: userId } = req.user;
      
      if (role === 'Manager') {
        // Manager can only assign to their own projects
        const project = await Project.getById(project_id);
        if (project.project_head_id !== userId) {
          return res.status(403).json({
            success: false,
            message: 'You can only assign employees to your own projects'
          });
        }
      } else if (!['HR', 'SkipManager'].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to assign employees'
        });
      }

      const assignment = await Project.assignEmployee({
        project_id,
        emp_id,
        role_in_project: role_in_project || null,
        start_date: start_date || null,
        end_date: end_date || null,
        allocation_percent: allocation_percent || null
      });

      res.status(201).json({
        success: true,
        data: assignment,
        message: 'Employee assigned to project successfully'
      });
    } catch (error) {
      console.error('Error assigning employee:', error);
      
      // Handle unique constraint violation
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          message: 'Employee is already assigned to this project with the same start date'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error assigning employee',
        error: error.message
      });
    }
  },

  // Remove employee from project
  removeEmployee: async (req, res) => {
    try {
      const { assignmentId } = req.params;

      // Check permissions
      const { role } = req.user;
      
      if (!['HR', 'SkipManager', 'Manager'].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to remove employees'
        });
      }

      const removed = await Project.removeEmployee(assignmentId);

      if (!removed) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Employee removed from project successfully'
      });
    } catch (error) {
      console.error('Error removing employee:', error);
      res.status(500).json({
        success: false,
        message: 'Error removing employee',
        error: error.message
      });
    }
  },

  // Get all employees (for assignment dropdown)
  getAllEmployees: async (req, res) => {
    try {
      const employees = await Project.getAllEmployees();
      res.status(200).json({
        success: true,
        data: employees,
        message: 'Employees retrieved successfully'
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

  // Get potential project managers
  getPotentialManagers: async (req, res) => {
    try {
      const managers = await Project.getPotentialManagers();
      res.status(200).json({
        success: true,
        data: managers,
        message: 'Potential managers retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching potential managers:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching potential managers',
        error: error.message
      });
    }
  }
};

module.exports = projectController;