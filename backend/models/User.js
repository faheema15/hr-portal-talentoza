// backend/models/User.js
const pool = require('../config/database');

class User {
  // Find user by ID
  static async find_by_id(id) {
    try {
      const result = await pool.query(
        'SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Find user by email
  static async find_by_email(email) {
    try {
      const result = await pool.query(
        'SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Find user with password (for authentication)
  static async find_by_email_with_password(email) {
    try {
      const result = await pool.query(
        'SELECT id, name, email, password, role, is_active, created_at, updated_at FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Get all users
  static async find_all() {
    try {
      const result = await pool.query(
        'SELECT id, name, email, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get users by role
  static async find_by_role(role) {
    try {
      const result = await pool.query(
        'SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE role = $1 ORDER BY name',
        [role]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get active users only
  static async find_all_active() {
    try {
      const result = await pool.query(
        'SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE is_active = true ORDER BY name'
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Create new user
  static async create(user_data) {
    try {
      const { name, email, password, role = 'employee' } = user_data;
      const result = await pool.query(
        `INSERT INTO users (name, email, password, role, is_active) 
         VALUES ($1, $2, $3, $4, true) 
         RETURNING id, name, email, role, is_active, created_at, updated_at`,
        [name, email, password, role]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update user
  static async update(id, user_data) {
    try {
      const fields = [];
      const values = [];
      let param_count = 1;

      // Build dynamic update query
      if (user_data.name !== undefined) {
        fields.push(`name = $${param_count}`);
        values.push(user_data.name);
        param_count++;
      }
      if (user_data.email !== undefined) {
        fields.push(`email = $${param_count}`);
        values.push(user_data.email);
        param_count++;
      }
      if (user_data.role !== undefined) {
        fields.push(`role = $${param_count}`);
        values.push(user_data.role);
        param_count++;
      }
      if (user_data.is_active !== undefined) {
        fields.push(`is_active = $${param_count}`);
        values.push(user_data.is_active);
        param_count++;
      }
      if (user_data.password !== undefined) {
        fields.push(`password = $${param_count}`);
        values.push(user_data.password);
        param_count++;
      }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const query = `
        UPDATE users 
        SET ${fields.join(', ')}
        WHERE id = $${param_count}
        RETURNING id, name, email, role, is_active, created_at, updated_at
      `;

      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Soft delete user (set is_active to false)
  static async soft_delete(id) {
    try {
      const result = await pool.query(
        'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, name, email',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Reactivate user
  static async reactivate(id) {
    try {
      const result = await pool.query(
        'UPDATE users SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, name, email, role, is_active',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Hard delete user (permanent)
  static async delete(id) {
    try {
      const result = await pool.query(
        'DELETE FROM users WHERE id = $1 RETURNING id',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Get user with employee details
  static async find_with_employee_details(user_id) {
    try {
      const result = await pool.query(
        `SELECT 
          u.id, u.name, u.email, u.role, u.is_active, u.created_at, u.updated_at,
          ed.emp_id, ed.designation, ed.department_id, ed.reporting_manager_id,
          ed.dob, ed.contact1, ed.email1, ed.marital_status,
          ed.present_address, ed.permanent_address, ed.photo_url,
          d.name as department_name,
          rm.name as reporting_manager_name
         FROM users u
         LEFT JOIN employee_details ed ON u.id = ed.user_id
         LEFT JOIN departments d ON ed.department_id = d.id
         LEFT JOIN users rm ON ed.reporting_manager_id = rm.id
         WHERE u.id = $1`,
        [user_id]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Get user by emp_id
  static async find_by_emp_id(emp_id) {
    try {
      const result = await pool.query(
        `SELECT 
          u.id, u.name, u.email, u.role, u.is_active, u.created_at, u.updated_at,
          ed.emp_id, ed.designation, ed.department_id
         FROM users u
         INNER JOIN employee_details ed ON u.id = ed.user_id
         WHERE ed.emp_id = $1`,
        [emp_id]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Count users by role
  static async count_by_role() {
    try {
      const result = await pool.query(
        `SELECT role, COUNT(*) as count 
         FROM users 
         WHERE is_active = true 
         GROUP BY role`
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get active users count
  static async count_active() {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) as count FROM users WHERE is_active = true'
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  // Get total users count
  static async count_all() {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) as count FROM users'
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  // Search users by name or email
  static async search(search_term) {
    try {
      const result = await pool.query(
        `SELECT id, name, email, role, is_active, created_at, updated_at 
         FROM users 
         WHERE name ILIKE $1 OR email ILIKE $1
         ORDER BY name`,
        [`%${search_term}%`]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get users with pagination
  static async find_paginated(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      const conditions = [];
      const values = [];
      let param_count = 1;

      // Apply filters
      if (filters.role) {
        conditions.push(`role = $${param_count}`);
        values.push(filters.role);
        param_count++;
      }
      if (filters.is_active !== undefined) {
        conditions.push(`is_active = $${param_count}`);
        values.push(filters.is_active);
        param_count++;
      }
      if (filters.search_term) {
        conditions.push(`(name ILIKE $${param_count} OR email ILIKE $${param_count})`);
        values.push(`%${filters.search_term}%`);
        param_count++;
      }

      const where_clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const count_query = `SELECT COUNT(*) as total FROM users ${where_clause}`;
      const count_result = await pool.query(count_query, values);
      const total = parseInt(count_result.rows[0].total);

      // Get paginated results
      values.push(limit, offset);
      const data_query = `
        SELECT id, name, email, role, is_active, created_at, updated_at 
        FROM users 
        ${where_clause}
        ORDER BY created_at DESC
        LIMIT $${param_count} OFFSET $${param_count + 1}
      `;
      const data_result = await pool.query(data_query, values);

      return {
        data: data_result.rows,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get managers (users with role 'manager' or 'skip_level_manager')
  static async find_all_managers() {
    try {
      const result = await pool.query(
        `SELECT id, name, email, role, is_active, created_at, updated_at 
         FROM users 
         WHERE role IN ('manager', 'skip_level_manager') AND is_active = true
         ORDER BY name`
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get HR users
  static async find_all_hr() {
    try {
      const result = await pool.query(
        `SELECT id, name, email, role, is_active, created_at, updated_at 
         FROM users 
         WHERE role = 'hr' AND is_active = true
         ORDER BY name`
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Check if email exists
  static async email_exists(email, exclude_user_id = null) {
    try {
      let query = 'SELECT id FROM users WHERE email = $1';
      const values = [email];

      if (exclude_user_id) {
        query += ' AND id != $2';
        values.push(exclude_user_id);
      }

      const result = await pool.query(query, values);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // Update password
  static async update_password(id, hashed_password) {
    try {
      const result = await pool.query(
        'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
        [hashed_password, id]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Get user's team members (employees reporting to this user)
  static async find_team_members(manager_id) {
    try {
      const result = await pool.query(
        `SELECT 
          u.id, u.name, u.email, u.role, u.is_active,
          ed.emp_id, ed.designation, ed.department_id
         FROM users u
         INNER JOIN employee_details ed ON u.id = ed.user_id
         WHERE ed.reporting_manager_id = $1 AND u.is_active = true
         ORDER BY u.name`,
        [manager_id]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;