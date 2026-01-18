// backend/models/EmployeeDetails.js
const pool = require('../config/database');

class EmployeeDetails {
  // Create employee with all related records - SIMPLIFIED VERSION
  static async createWithTransaction(client, data) {
    // 1. Insert into employee_details (WITHOUT user_id initially)
    const employeeQuery = `
      INSERT INTO employee_details (
        designation, department_id, reporting_manager_id,
        dob, aadhar_no, pan_no, passport_no,
        contact1, contact2, email1, email2,
        father_name, mother_name, present_address, permanent_address,
        marital_status, spouse_name,
        emergency_contact_name, emergency_relation, emergency_contact_number,
        ready_for_relocation, criminal_cases, addictions,
        health_condition, pandemic_diseases, photo_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      RETURNING *
    `;
    
    const employeeValues = [
      data.designation || null,
      data.department_id || null,
      data.reporting_manager_id || null,
      data.dob || null,
      data.aadhar_no || null,
      data.pan_no || null,
      data.passport_no || null,
      data.contact1 || null,
      data.contact2 || null,
      data.email1 || null,
      data.email2 || null,
      data.father_name || null,
      data.mother_name || null,
      data.present_address || null,
      data.permanent_address || null,
      data.marital_status || 'Single',
      data.spouse_name || null,
      data.emergency_contact_name || null,
      data.emergency_relation || null,
      data.emergency_contact_number || null,
      data.ready_for_relocation || false,
      data.criminal_cases || false,
      data.addictions || null,
      data.health_condition || null,
      data.pandemic_diseases || null,
      data.photo_url || null
    ];

    const employeeResult = await client.query(employeeQuery, employeeValues);
    const employee = employeeResult.rows[0];
    const emp_id = employee.emp_id;
    
    // 2. Auto-create joining_details record
    await client.query(`
      INSERT INTO joining_details (emp_id, date_of_joining)
      VALUES ($1, $2)
    `, [emp_id, new Date()]);
    
    // 3. Auto-create bank_details record with null values
    await client.query(`
      INSERT INTO bank_details (
        emp_id, bank_name, branch_address, account_number, ifsc_code,
        start_date, is_primary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [emp_id, null, null, null, null, new Date(), true]);
    
    // 4. Auto-create bgv record
    await client.query(`
      INSERT INTO bgv (emp_id, status, remarks)
      VALUES ($1, $2, $3)
    `, [emp_id, 'Yellow', 'Pending verification']);
    
    // 5. Auto-create leave_types records for current year
    const currentYear = new Date().getFullYear();
    const leaveTypes = [
      { type: 'Casual', allocated: 12 },
      { type: 'Sick', allocated: 10 },
      { type: 'Earned', allocated: 15 }
    ];
    
    for (const leave of leaveTypes) {
      await client.query(`
        INSERT INTO leave_types (
          emp_id, leave_type, allocated, consumed, remaining, year
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [emp_id, leave.type, leave.allocated, 0, leave.allocated, currentYear]);
    }
    
    // 6. Auto-create salary record with zero values
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    await client.query(`
      INSERT INTO salary (
        emp_id, salary_month,
        basic_salary, hra, conveyance_allowance,
        medical_allowance, special_allowance, other_allowances,
        bonus, gross_salary, provident_fund, professional_tax,
        income_tax, total_deductions, net_salary,
        payment_mode, payment_date, remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    `, [
      emp_id, currentMonth,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      'Bank Transfer', null, 'Initial record - to be updated'
    ]);
    
    // 7. Auto-create insurance record
    await client.query(`
      INSERT INTO insurance (
        emp_id, provider, policy_number, policy_type,
        coverage_amount, premium_amount, start_date, end_date,
        status, remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      emp_id, null, null, null,
      0, 0, null, null,
      'Active', 'Not enrolled yet'
    ]);
    
    return employee;
  }

  // Link user account to employee record
  static async linkUserAccount(client, emp_id, user_id) {
    const query = `
      UPDATE employee_details 
      SET user_id = $1
      WHERE emp_id = $2
      RETURNING *
    `;
    const result = await client.query(query, [user_id, emp_id]);
    return result.rows[0];
  }

  // Get all employees with basic info
  static async findAll() {
    const query = `
      SELECT 
        ed.emp_id,
        ed.user_id,
        ed.full_name,
        ed.photo_url,
        ed.contact1,
        ed.email1,
        u.id as user_id_from_users,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role,
        ed.designation,
        d.name as department_name,
        ed.created_at,
        COALESCE(ed.full_name, u.name, 'N/A') as display_name
      FROM employee_details ed
      LEFT JOIN users u ON ed.user_id = u.id
      LEFT JOIN departments d ON ed.department_id = d.id
      ORDER BY ed.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Get employee by emp_id with all details
  static async findByEmpId(emp_id) {
    const query = `
      SELECT 
        ed.*,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role,
        d.name as department_name,
        rm.name as reporting_manager_name
      FROM employee_details ed
      LEFT JOIN users u ON ed.user_id = u.id
      LEFT JOIN departments d ON ed.department_id = d.id
      LEFT JOIN users rm ON ed.reporting_manager_id = rm.id
      WHERE ed.emp_id = $1
    `;
    const result = await pool.query(query, [emp_id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  }

  // Update employee
  // Update employee
static async update(emp_id, data) {
  // Helper function to convert empty strings to null for date fields
  const sanitizeDate = (value) => {
    if (value === '' || value === undefined) return null;
    return value;
  };

  const query = `
    UPDATE employee_details SET
      user_id = COALESCE($1, user_id),
      designation = COALESCE($2, designation),
      department_id = COALESCE($3, department_id),
      reporting_manager_id = COALESCE($4, reporting_manager_id),
      dob = COALESCE($5, dob),
      aadhar_no = COALESCE($6, aadhar_no),
      pan_no = COALESCE($7, pan_no),
      passport_no = COALESCE($8, passport_no),
      contact1 = COALESCE($9, contact1),
      contact2 = COALESCE($10, contact2),
      email1 = COALESCE($11, email1),
      email2 = COALESCE($12, email2),
      father_name = COALESCE($13, father_name),
      mother_name = COALESCE($14, mother_name),
      present_address = COALESCE($15, present_address),
      permanent_address = COALESCE($16, permanent_address),
      marital_status = COALESCE($17, marital_status),
      spouse_name = COALESCE($18, spouse_name),
      emergency_contact_name = COALESCE($19, emergency_contact_name),
      emergency_relation = COALESCE($20, emergency_relation),
      emergency_contact_number = COALESCE($21, emergency_contact_number),
      ready_for_relocation = COALESCE($22, ready_for_relocation),
      criminal_cases = COALESCE($23, criminal_cases),
      addictions = COALESCE($24, addictions),
      health_condition = COALESCE($25, health_condition),
      pandemic_diseases = COALESCE($26, pandemic_diseases),
      photo_url = COALESCE($27, photo_url),
      aadhar_document_url = COALESCE($28, aadhar_document_url),
      pan_document_url = COALESCE($29, pan_document_url)
    WHERE emp_id = $30
    RETURNING *
  `;
  
  const values = [
    data.user_id || null,
    data.designation || null,
    data.department_id || null,
    data.reporting_manager_id || null,
    sanitizeDate(data.dob),
    data.aadhar_no || null,
    data.pan_no || null,
    data.passport_no || null,
    data.contact1 || null,
    data.contact2 || null,
    data.email1 || null,
    data.email2 || null,
    data.father_name || null,
    data.mother_name || null,
    data.present_address || null,
    data.permanent_address || null,
    data.marital_status || null,
    data.spouse_name || null,
    data.emergency_contact_name || null,
    data.emergency_relation || null,
    data.emergency_contact_number || null,
    data.ready_for_relocation !== undefined ? data.ready_for_relocation : null,
    data.criminal_cases !== undefined ? data.criminal_cases : null,
    data.addictions || null,
    data.health_condition || null,
    data.pandemic_diseases || null,
    data.photo_url || null,
    data.aadhar_document_url || null,  // ← ADD THIS (parameter $28)
    data.pan_document_url || null,     // ← ADD THIS (parameter $29)
    emp_id                              // ← This is parameter $30
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

  // Delete employee (cascades to related records)
  static async delete(emp_id) {
    const query = 'DELETE FROM employee_details WHERE emp_id = $1 RETURNING *';
    const result = await pool.query(query, [emp_id]);
    return result.rows[0];
  }
}

module.exports = EmployeeDetails;