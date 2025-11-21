// backend/models/department.js
const db = require('../config/database');

const Department = {
  // Get all departments
  getAll: async () => {
  try {
    const query = `
      SELECT 
        d.id,
        d.name,
        d.head_id,
        u.name as head_name,
        d.created_at,
        d.updated_at
      FROM departments d
      LEFT JOIN users u ON d.head_id = u.id
      ORDER BY d.id ASC
    `;
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    throw error;
  }
  },

  // Get department by ID
  getById: async (id) => {
    try {
      const query = `
  SELECT 
    d.id as dept_id,
    d.name as dept_name,
    d.head_id,
    u.name as head_name,
    d.created_at,
    d.updated_at
  FROM departments d
  LEFT JOIN users u ON d.head_id = u.id
  WHERE d.id = $1
`;
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Create new department
  create: async (dept_name, head_id = null) => {
    try {
      const query = `
  INSERT INTO departments (name, head_id)
  VALUES ($1, $2)
  RETURNING 
    id as dept_id,
    name as dept_name,
    head_id,
    created_at,
    updated_at
`;
      const result = await db.query(query, [dept_name, head_id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Update department
  update: async (id, dept_name, head_id = null) => {
    try {
      const query = `
  UPDATE departments 
  SET name = $1, head_id = $2
  WHERE id = $3
  RETURNING 
    id as dept_id,
    name as dept_name,
    head_id,
    updated_at
`;
      const result = await db.query(query, [dept_name, head_id, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Delete department
  delete: async (id) => {
    try {
      const query = 'DELETE FROM departments WHERE id = $1 RETURNING id as dept_id';
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Get all users who can be department heads (Managers and above)
  getPotentialHeads: async () => {
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

module.exports = Department;