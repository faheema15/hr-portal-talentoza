const pool = require('../config/database');

class BankDetails {
  // Create bank details record
  static async create(data) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const query = `
        INSERT INTO bank_details (
          emp_id, bank_name, branch_address, account_number, ifsc_code,
          pan_card, cancelled_cheque_url, bank_passbook_url, start_date, is_primary
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const values = [
        data.empId,
        data.bankName,
        data.branchAddress,
        data.bankAccountNumber,
        data.ifscCode,
        data.panCard || null,
        data.cancelledCheque || null,
        data.bankPassbook || null,
        data.startDate || new Date(),
        true
      ];

      const result = await client.query(query, values);
      
      await client.query('COMMIT');
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get all bank details
  static async findAll() {
    const query = `
      SELECT 
        bd.*,
        ed.full_name as emp_name
      FROM bank_details bd
      LEFT JOIN employee_details ed ON bd.emp_id = ed.emp_id
      ORDER BY bd.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Get bank details by emp_id
  static async findByEmpId(empId) {
    const query = `
      SELECT * FROM bank_details 
      WHERE emp_id = $1 
      AND (end_date IS NULL OR end_date > CURRENT_DATE)
      ORDER BY is_primary DESC, created_at DESC
      LIMIT 1
    `;
    const result = await pool.query(query, [empId]);
    return result.rows[0];
  }

  // Update bank details
  static async update(empId, data) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if bank details exist
      const checkQuery = 'SELECT id FROM bank_details WHERE emp_id = $1 AND (end_date IS NULL OR end_date > CURRENT_DATE) LIMIT 1';
      const checkResult = await client.query(checkQuery, [empId]);
      
      if (checkResult.rows.length === 0) {
        // Create new if doesn't exist
        const insertQuery = `
          INSERT INTO bank_details (
            emp_id, bank_name, branch_address, account_number, ifsc_code,
            pan_card, cancelled_cheque_url, bank_passbook_url, start_date, is_primary
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `;
        
        const values = [
          empId,
          data.bankName,
          data.branchAddress,
          data.bankAccountNumber,
          data.ifscCode,
          data.panCard || null,
          data.cancelledCheque || null,
          data.bankPassbook || null,
          new Date(),
          true
        ];
        
        const result = await client.query(insertQuery, values);
        await client.query('COMMIT');
        return result.rows[0];
      }
      
      // Update existing
      const updateQuery = `
        UPDATE bank_details SET
          bank_name = $1,
          branch_address = $2,
          account_number = $3,
          ifsc_code = $4,
          pan_card = COALESCE($5, pan_card),
          cancelled_cheque_url = COALESCE($6, cancelled_cheque_url),
          bank_passbook_url = COALESCE($7, bank_passbook_url),
          updated_at = CURRENT_TIMESTAMP
        WHERE emp_id = $8
        AND (end_date IS NULL OR end_date > CURRENT_DATE)
        RETURNING *
      `;
      
      const values = [
        data.bankName,
        data.branchAddress,
        data.bankAccountNumber,
        data.ifscCode,
        data.panCard || null,
        data.cancelledCheque || null,
        data.bankPassbook || null,
        empId
      ];

      const result = await client.query(updateQuery, values);
      await client.query('COMMIT');
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Update error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete bank details
  static async delete(empId) {
    const query = 'DELETE FROM bank_details WHERE emp_id = $1 RETURNING *';
    const result = await pool.query(query, [empId]);
    return result.rows[0];
  }
}

module.exports = BankDetails;