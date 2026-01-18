// backend/controllers/departmentController.js
const Department = require('../models/department');

const departmentController = {
  // Get all departments
  getAllDepartments: async (req, res) => {
    try {
      const departments = await Department.getAll();
      res.status(200).json({
        success: true,
        data: departments,
        message: 'Departments retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching departments',
        error: error.message
      });
    }
  },

  // Get department by ID
  getDepartmentById: async (req, res) => {
    try {
      const { id } = req.params;
      const department = await Department.getById(id);
      
      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }

      res.status(200).json({
        success: true,
        data: department,
        message: 'Department retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching department:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching department',
        error: error.message
      });
    }
  },

  // Create new department
  createDepartment: async (req, res) => {
    try {
      const { dept_name, head_id } = req.body;

      // Validation
      if (!dept_name || dept_name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Department name is required'
        });
      }

      // Only HR can create departments
      if (req.user.role !== 'HR') {
        return res.status(403).json({
          success: false,
          message: 'Only HR can create departments'
        });
      }

      const newDepartment = await Department.create(dept_name.trim(), head_id || null);

      res.status(201).json({
        success: true,
        data: newDepartment,
        message: 'Department created successfully'
      });
    } catch (error) {
      console.error('Error creating department:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating department',
        error: error.message
      });
    }
  },

  // Update department
  updateDepartment: async (req, res) => {
    try {
      const { id } = req.params;
      const { dept_name, head_id } = req.body;

      // Validation
      if (!dept_name || dept_name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Department name is required'
        });
      }

      // Only HR and SkipManager can update departments
      if (!['HR', 'SkipManager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update department'
        });
      }

      const updatedDepartment = await Department.update(id, dept_name.trim(), head_id || null);

      if (!updatedDepartment) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }

      res.status(200).json({
        success: true,
        data: updatedDepartment,
        message: 'Department updated successfully'
      });
    } catch (error) {
      console.error('Error updating department:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating department',
        error: error.message
      });
    }
  },

  // Delete department
  deleteDepartment: async (req, res) => {
    try {
      const { id } = req.params;

      // Only HR can delete departments
      if (req.user.role !== 'HR') {
        return res.status(403).json({
          success: false,
          message: 'Only HR can delete departments'
        });
      }

      const deletedDepartment = await Department.delete(id);

      if (!deletedDepartment) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Department deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting department:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting department',
        error: error.message
      });
    }
  },

  // Get potential department heads
  getPotentialHeads: async (req, res) => {
    try {
      const users = await Department.getPotentialHeads();
      res.status(200).json({
        success: true,
        data: users,
        message: 'Potential heads retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching potential heads:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching potential heads',
        error: error.message
      });
    }
  },
  
  getDepartmentMembers: async (req, res) => {
    try {
      const { id } = req.params;
      const members = await Department.getDepartmentMembers(id);
      
      res.status(200).json({
        success: true,
        data: members,
        message: 'Department members retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching department members:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching department members',
        error: error.message
      });
    }
  }
};


module.exports = departmentController;