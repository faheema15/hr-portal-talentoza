// backend/models/project.js
const db = require('../config/database');

const Project = {
  // Get all projects (for HR and SkipManager)
  getAll: async () => {
    try {
      const query = `
        SELECT 
          p.id as project_id,
          p.name as project_name,
          p.start_date,
          p.end_date,
          p.status,
          p.manager_id as project_head_id,
          u.name as project_head_name,
          p.created_at,
          p.updated_at
        FROM projects p
        LEFT JOIN users u ON p.manager_id = u.id
        ORDER BY p.id DESC
      `;
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get projects by manager ID (for Manager role)
  getByManagerId: async (managerId) => {
    try {
      const query = `
        SELECT 
          p.id as project_id,
          p.name as project_name,
          p.start_date,
          p.end_date,
          p.status,
          p.manager_id as project_head_id,
          u.name as project_head_name,
          p.created_at,
          p.updated_at
        FROM projects p
        LEFT JOIN users u ON p.manager_id = u.id
        WHERE p.manager_id = $1
        ORDER BY p.id DESC
      `;
      const result = await db.query(query, [managerId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get projects by employee ID (for Employee role)
  getByEmployeeId: async (empId) => {
    try {
      const query = `
        SELECT DISTINCT
          p.id as project_id,
          p.name as project_name,
          p.start_date,
          p.end_date,
          p.status,
          p.manager_id as project_head_id,
          u.name as project_head_name,
          pa.role_in_project,
          pa.allocation_percent,
          p.created_at,
          p.updated_at
        FROM projects p
        LEFT JOIN users u ON p.manager_id = u.id
        INNER JOIN project_assignments pa ON p.id = pa.project_id
        WHERE pa.emp_id = $1
        ORDER BY p.id DESC
      `;
      const result = await db.query(query, [empId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get project by ID with details
  getById: async (id) => {
    try {
      const query = `
        SELECT 
          p.id as project_id,
          p.project_code,
          p.name as project_name,
          p.description,
          p.client_name,
          p.client_contact,
          p.start_date,
          p.end_date,
          p.budget,
          p.actual_cost,
          p.status,
          p.priority,
          p.manager_id as project_head_id,
          u.name as project_head_name,
          u.email as project_head_email,
          p.technologies,
          p.remarks,
          p.created_at,
          p.updated_at
        FROM projects p
        LEFT JOIN users u ON p.manager_id = u.id
        WHERE p.id = $1
      `;
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Get project members/assignments
  getProjectMembers: async (projectId) => {
    try {
      const query = `
        SELECT 
          pa.id as assignment_id,
          pa.emp_id,
          ed.user_id,
          u.name as employee_name,
          u.email as employee_email,
          ed.designation,
          pa.role_in_project,
          pa.start_date,
          pa.end_date,
          pa.allocation_percent,
          pa.created_at
        FROM project_assignments pa
        INNER JOIN employee_details ed ON pa.emp_id = ed.emp_id
        INNER JOIN users u ON ed.user_id = u.id
        WHERE pa.project_id = $1
        ORDER BY pa.created_at DESC
      `;
      const result = await db.query(query, [projectId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Create new project
  create: async (projectData) => {
    try {
      const { project_name, start_date, end_date, status, manager_id } = projectData;
      const query = `
        INSERT INTO projects (name, start_date, end_date, status, manager_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING 
          id as project_id,
          name as project_name,
          start_date,
          end_date,
          status,
          manager_id as project_head_id,
          created_at
      `;
      const result = await db.query(query, [project_name, start_date, end_date, status, manager_id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Update project
  update: async (id, projectData) => {
    try {
      const { project_name, start_date, end_date, status, manager_id } = projectData;
      const query = `
        UPDATE projects 
        SET name = $1, start_date = $2, end_date = $3, status = $4, manager_id = $5
        WHERE id = $6
        RETURNING 
          id as project_id,
          name as project_name,
          start_date,
          end_date,
          status,
          manager_id as project_head_id,
          updated_at
      `;
      const result = await db.query(query, [project_name, start_date, end_date, status, manager_id, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Delete project
  delete: async (id) => {
    try {
      const query = 'DELETE FROM projects WHERE id = $1 RETURNING id';
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Assign employee to project
  assignEmployee: async (assignmentData) => {
    try {
      const { project_id, emp_id, role_in_project, start_date, end_date, allocation_percent } = assignmentData;
      const query = `
        INSERT INTO project_assignments (project_id, emp_id, role_in_project, start_date, end_date, allocation_percent)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING 
          id as assignment_id,
          project_id,
          emp_id,
          role_in_project,
          start_date,
          end_date,
          allocation_percent,
          created_at
      `;
      const result = await db.query(query, [project_id, emp_id, role_in_project, start_date, end_date, allocation_percent]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Remove employee from project
  removeEmployee: async (assignmentId) => {
    try {
      const query = 'DELETE FROM project_assignments WHERE id = $1 RETURNING id';
      const result = await db.query(query, [assignmentId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Get all employees (for assignment dropdown)
  getAllEmployees: async () => {
    try {
      const query = `
        SELECT 
          ed.emp_id,
          ed.user_id,
          u.name as employee_name,
          u.email as employee_email,
          ed.designation,
          d.name as department_name
        FROM employee_details ed
        INNER JOIN users u ON ed.user_id = u.id
        LEFT JOIN departments d ON ed.department_id = d.id
        WHERE u.is_active = true
        ORDER BY u.name ASC
      `;
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get potential project managers
  getPotentialManagers: async () => {
    try {
      const query = `
        SELECT 
          id as user_id,
          name as user_name,
          role,
          email
        FROM users
        WHERE role IN ('HR', 'Manager', 'SkipManager')
        AND is_active = true
        ORDER BY name ASC
      `;
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Project;