const pool = require('../config/database');

class JoiningDetails {
  // Create joining details with previous employments
  static async create(data) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Insert joining_details
      const joiningQuery = `
        INSERT INTO joining_details (emp_id, date_of_joining)
        VALUES ($1, $2)
        RETURNING *
      `;
      
      const joiningResult = await client.query(joiningQuery, [
        data.empId,
        data.dateOfJoining || new Date()
      ]);
      
      const joiningId = joiningResult.rows[0].id;
      
      // 2. Insert previous employments if provided
      if (data.previousEmployments && data.previousEmployments.length > 0) {
        for (const emp of data.previousEmployments) {
          const empQuery = `
            INSERT INTO previous_employment (
              joining_id, company_name, start_date, end_date, 
              designation, offer_letter_url, relieving_letter_url, payslip_urls
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `;
          
          await client.query(empQuery, [
            joiningId,
            emp.companyName,
            emp.startDate || null,
            emp.endDate || null,
            emp.designation,
            emp.offerLetter,
            emp.releavingLetter,
            emp.paySlips
          ]);
        }
      }
      
      await client.query('COMMIT');
      return joiningResult.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get all joining details
  static async findAll() {
    const query = `
      SELECT 
        jd.*,
        ed.full_name,
        ed.designation,
        d.name as department_name
      FROM joining_details jd
      LEFT JOIN employee_details ed ON jd.emp_id = ed.emp_id
      LEFT JOIN departments d ON ed.department_id = d.id
      ORDER BY jd.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Get joining details by emp_id
  static async findByEmpId(empId) {
    const query = 'SELECT * FROM joining_details WHERE emp_id = $1';
    const result = await pool.query(query, [empId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    
    return {
      empId: row.emp_id,
      dateOfJoining: row.date_of_joining
    };
  }

  // Update joining details
  static async update(empId, data) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Update joining_details
      const joiningQuery = `
        UPDATE joining_details 
        SET date_of_joining = $1, updated_at = CURRENT_TIMESTAMP
        WHERE emp_id = $2
        RETURNING *
      `;
      
      const joiningResult = await client.query(joiningQuery, [
        data.dateOfJoining,
        empId
      ]);
      
      if (joiningResult.rows.length === 0) {
        throw new Error('Joining details not found');
      }
      
      const joiningId = joiningResult.rows[0].id;
      
      // 2. Delete existing previous employments
      await client.query('DELETE FROM previous_employment WHERE joining_id = $1', [joiningId]);
      
      // 3. Insert new previous employments
      if (data.previousEmployments && data.previousEmployments.length > 0) {
        for (const emp of data.previousEmployments) {
          const empQuery = `
            INSERT INTO previous_employment (
              joining_id, company_name, start_date, end_date, 
              designation, offer_letter_url, relieving_letter_url, payslip_urls
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `;
          
          await client.query(empQuery, [
            joiningId,
            emp.companyName,
            emp.startDate || null,
            emp.endDate || null,
            emp.designation,
            emp.offerLetter,
            emp.releavingLetter,
            emp.paySlips
          ]);
        }
      }
      
      await client.query('COMMIT');
      return joiningResult.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Update error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete joining details
  static async delete(empId) {
    const query = 'DELETE FROM joining_details WHERE emp_id = $1 RETURNING *';
    const result = await pool.query(query, [empId]);
    return result.rows[0];
  }
}

module.exports = JoiningDetails;