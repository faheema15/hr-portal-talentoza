const pool = require('../config/database');

class BankDetails {
  // Create bank details record
  static async create(data) {
    const query = `
      INSERT INTO bank_details (
        emp_id, photo, dob, aadhar_number, pan_number, passport_number,
        emp_name, contact1, contact2, mail_id1, mail_id2,
        date_of_joining, bank_name, branch_address, bank_account_number, ifsc_code
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16
      )
      RETURNING *
    `;
    
    const values = [
      data.empId, data.photo, data.dob, data.aadharNumber, data.panNumber, data.passportNumber,
      data.empName, data.contact1, data.contact2, data.mailId1, data.mailId2,
      data.dateOfJoining, data.bankName, data.branchAddress, data.bankAccountNumber, data.ifscCode
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get all bank details
  static async findAll() {
    const query = 'SELECT * FROM bank_details ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  // Get bank details by emp_id
  static async findByEmpId(empId) {
    const query = 'SELECT * FROM bank_details WHERE emp_id = $1';
    const result = await pool.query(query, [empId]);
    return result.rows[0];
  }

  // Get bank details by account number
  static async findByAccountNumber(accountNumber) {
    const query = 'SELECT * FROM bank_details WHERE bank_account_number = $1';
    const result = await pool.query(query, [accountNumber]);
    return result.rows[0];
  }

  // Get employees by bank name
  static async findByBankName(bankName) {
    const query = `
      SELECT * FROM bank_details 
      WHERE bank_name ILIKE $1 
      ORDER BY emp_name ASC
    `;
    const result = await pool.query(query, [`%${bankName}%`]);
    return result.rows;
  }

  // Get employees by IFSC code
  static async findByIFSC(ifscCode) {
    const query = `
      SELECT * FROM bank_details 
      WHERE ifsc_code = $1 
      ORDER BY emp_name ASC
    `;
    const result = await pool.query(query, [ifscCode]);
    return result.rows;
  }

  // Search by PAN number
  static async findByPAN(panNumber) {
    const query = 'SELECT * FROM bank_details WHERE pan_number = $1';
    const result = await pool.query(query, [panNumber]);
    return result.rows[0];
  }

  // Search by Aadhar number
  static async findByAadhar(aadharNumber) {
    const query = 'SELECT * FROM bank_details WHERE aadhar_number = $1';
    const result = await pool.query(query, [aadharNumber]);
    return result.rows[0];
  }

  // Update bank details
  static async update(empId, data) {
    const query = `
      UPDATE bank_details SET
        photo = $1, dob = $2, aadhar_number = $3, pan_number = $4, passport_number = $5,
        emp_name = $6, contact1 = $7, contact2 = $8, mail_id1 = $9, mail_id2 = $10,
        date_of_joining = $11, bank_name = $12, branch_address = $13, 
        bank_account_number = $14, ifsc_code = $15,
        updated_at = CURRENT_TIMESTAMP
      WHERE emp_id = $16
      RETURNING *
    `;
    
    const values = [
      data.photo, data.dob, data.aadharNumber, data.panNumber, data.passportNumber,
      data.empName, data.contact1, data.contact2, data.mailId1, data.mailId2,
      data.dateOfJoining, data.bankName, data.branchAddress, data.bankAccountNumber, data.ifscCode,
      empId
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update only banking information
  static async updateBankingInfo(empId, bankData) {
    const query = `
      UPDATE bank_details SET
        bank_name = $1, 
        branch_address = $2, 
        bank_account_number = $3, 
        ifsc_code = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE emp_id = $5
      RETURNING *
    `;
    
    const values = [
      bankData.bankName,
      bankData.branchAddress,
      bankData.bankAccountNumber,
      bankData.ifscCode,
      empId
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete bank details
  static async delete(empId) {
    const query = 'DELETE FROM bank_details WHERE emp_id = $1 RETURNING *';
    const result = await pool.query(query, [empId]);
    return result.rows[0];
  }

  // Get bank-wise employee count
  static async getBankWiseSummary() {
    const query = `
      SELECT 
        bank_name,
        COUNT(*) as employee_count,
        COUNT(DISTINCT ifsc_code) as branch_count
      FROM bank_details
      WHERE bank_name IS NOT NULL AND bank_name != ''
      GROUP BY bank_name
      ORDER BY employee_count DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Get employees with incomplete bank details
  static async findIncompleteBankDetails() {
    const query = `
      SELECT emp_id, emp_name, contact1, mail_id1
      FROM bank_details
      WHERE bank_name IS NULL 
        OR bank_name = ''
        OR bank_account_number IS NULL 
        OR bank_account_number = ''
        OR ifsc_code IS NULL 
        OR ifsc_code = ''
      ORDER BY emp_name ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Verify bank details completeness
  static async verifyCompleteness(empId) {
    const query = `
      SELECT 
        emp_id,
        CASE 
          WHEN bank_name IS NOT NULL AND bank_name != '' 
            AND bank_account_number IS NOT NULL AND bank_account_number != ''
            AND ifsc_code IS NOT NULL AND ifsc_code != ''
          THEN true 
          ELSE false 
        END as is_complete,
        CASE 
          WHEN bank_name IS NULL OR bank_name = '' THEN 'Bank Name'
          WHEN bank_account_number IS NULL OR bank_account_number = '' THEN 'Account Number'
          WHEN ifsc_code IS NULL OR ifsc_code = '' THEN 'IFSC Code'
          ELSE 'Complete'
        END as missing_field
      FROM bank_details
      WHERE emp_id = $1
    `;
    const result = await pool.query(query, [empId]);
    return result.rows[0];
  }

  // Get statistics
  static async getStatistics() {
    const query = `
      SELECT 
        COUNT(*) as total_employees,
        COUNT(DISTINCT bank_name) as total_banks,
        COUNT(DISTINCT ifsc_code) as total_branches,
        COUNT(*) FILTER (
          WHERE bank_name IS NOT NULL AND bank_name != '' 
            AND bank_account_number IS NOT NULL AND bank_account_number != ''
            AND ifsc_code IS NOT NULL AND ifsc_code != ''
        ) as complete_records,
        COUNT(*) FILTER (
          WHERE bank_name IS NULL OR bank_name = ''
            OR bank_account_number IS NULL OR bank_account_number = ''
            OR ifsc_code IS NULL OR ifsc_code = ''
        ) as incomplete_records
      FROM bank_details
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }
}

module.exports = BankDetails;