const pool = require('../config/database');

class JoiningDetails {
  // Create joining details
  static async create(data) {
    // Helper function to convert empty strings to null for date fields
    const formatDate = (dateValue) => {
      return dateValue === "" || dateValue === undefined ? null : dateValue;
    };

    const query = `
      INSERT INTO joining_details (
        emp_id, photo, first_name, middle_name, last_name,
        contact1, contact2, mail_id1, mail_id2,
        date_of_joining, designation, department, project,
        edu_10th_board, edu_10th_year, edu_10th_cgpa, edu_10th_documents,
        edu_12th_board, edu_12th_year, edu_12th_cgpa, edu_12th_documents,
        graduation_board, graduation_year, graduation_cgpa, graduation_documents,
        post_graduation_board, post_graduation_year, post_graduation_cgpa, post_graduation_documents,
        phd_board, phd_year, phd_cgpa, phd_documents,
        certification_body, certification_enrollment, certification_year, certification_valid_till,
        research_papers,
        prev_company1_name, prev_company1_start_date, prev_company1_end_date,
        prev_company1_designation, prev_company1_offer_letter, prev_company1_releaving_letter, prev_company1_pay_slips,
        prev_company2_name, prev_company2_start_date, prev_company2_end_date,
        prev_company2_designation, prev_company2_offer_letter, prev_company2_releaving_letter, prev_company2_pay_slips
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
        $41, $42, $43, $44, $45, $46, $47, $48, $49, $50
      )
      RETURNING *
    `;
    
    const values = [
      data.empId, data.photo, data.firstName, data.middleName, data.lastName,
      data.contact1, data.contact2, data.mailId1, data.mailId2,
      formatDate(data.dateOfJoining), data.designation, data.department, data.project,
      data.edu10thBoard, data.edu10thYear, data.edu10thCGPA, data.edu10thDocuments,
      data.edu12thBoard, data.edu12thYear, data.edu12thCGPA, data.edu12thDocuments,
      data.graduationBoard, data.graduationYear, data.graduationCGPA, data.graduationDocuments,
      data.postGraduationBoard, data.postGraduationYear, data.postGraduationCGPA, data.postGraduationDocuments,
      data.phdBoard, data.phdYear, data.phdCGPA, data.phdDocuments,
      data.certificationBody, data.certificationEnrollment, data.certificationYear, data.certificationValidTill,
      data.researchPapers,
      data.prevCompany1Name, formatDate(data.prevCompany1StartDate), formatDate(data.prevCompany1EndDate),
      data.prevCompany1Designation, data.prevCompany1OfferLetter, data.prevCompany1ReleavingLetter, data.prevCompany1PaySlips,
      data.prevCompany2Name, formatDate(data.prevCompany2StartDate), formatDate(data.prevCompany2EndDate),
      data.prevCompany2Designation, data.prevCompany2OfferLetter, data.prevCompany2ReleavingLetter, data.prevCompany2PaySlips
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Create error:', error);
      throw error;
    }
  }

  // Get all joining details
  static async findAll() {
    const query = 'SELECT * FROM joining_details ORDER BY created_at DESC';
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
    
    // Transform to camelCase for frontend consistency
    return {
      empId: row.emp_id,
      photo: row.photo,
      firstName: row.first_name,
      middleName: row.middle_name,
      lastName: row.last_name,
      contact1: row.contact1,
      contact2: row.contact2,
      mailId1: row.mail_id1,
      mailId2: row.mail_id2,
      dateOfJoining: row.date_of_joining,
      designation: row.designation,
      department: row.department,
      project: row.project,
      edu10thBoard: row.edu_10th_board,
      edu10thYear: row.edu_10th_year,
      edu10thCGPA: row.edu_10th_cgpa,
      edu10thDocuments: row.edu_10th_documents,
      edu12thBoard: row.edu_12th_board,
      edu12thYear: row.edu_12th_year,
      edu12thCGPA: row.edu_12th_cgpa,
      edu12thDocuments: row.edu_12th_documents,
      graduationBoard: row.graduation_board,
      graduationYear: row.graduation_year,
      graduationCGPA: row.graduation_cgpa,
      graduationDocuments: row.graduation_documents,
      postGraduationBoard: row.post_graduation_board,
      postGraduationYear: row.post_graduation_year,
      postGraduationCGPA: row.post_graduation_cgpa,
      postGraduationDocuments: row.post_graduation_documents,
      phdBoard: row.phd_board,
      phdYear: row.phd_year,
      phdCGPA: row.phd_cgpa,
      phdDocuments: row.phd_documents,
      certificationBody: row.certification_body,
      certificationEnrollment: row.certification_enrollment,
      certificationYear: row.certification_year,
      certificationValidTill: row.certification_valid_till,
      researchPapers: row.research_papers,
      prevCompany1Name: row.prev_company1_name,
      prevCompany1StartDate: row.prev_company1_start_date,
      prevCompany1EndDate: row.prev_company1_end_date,
      prevCompany1Designation: row.prev_company1_designation,
      prevCompany1OfferLetter: row.prev_company1_offer_letter,
      prevCompany1ReleavingLetter: row.prev_company1_releaving_letter,
      prevCompany1PaySlips: row.prev_company1_pay_slips,
      prevCompany2Name: row.prev_company2_name,
      prevCompany2StartDate: row.prev_company2_start_date,
      prevCompany2EndDate: row.prev_company2_end_date,
      prevCompany2Designation: row.prev_company2_designation,
      prevCompany2OfferLetter: row.prev_company2_offer_letter,
      prevCompany2ReleavingLetter: row.prev_company2_releaving_letter,
      prevCompany2PaySlips: row.prev_company2_pay_slips
    };
  }

  // Update joining details
  static async update(empId, data) {
    // Helper function to convert empty strings to null for date fields
    const formatDate = (dateValue) => {
      return dateValue === "" || dateValue === undefined ? null : dateValue;
    };

    const query = `
      UPDATE joining_details SET
        photo = $1, first_name = $2, middle_name = $3, last_name = $4,
        contact1 = $5, contact2 = $6, mail_id1 = $7, mail_id2 = $8,
        date_of_joining = $9, designation = $10, department = $11, project = $12,
        edu_10th_board = $13, edu_10th_year = $14, edu_10th_cgpa = $15, edu_10th_documents = $16,
        edu_12th_board = $17, edu_12th_year = $18, edu_12th_cgpa = $19, edu_12th_documents = $20,
        graduation_board = $21, graduation_year = $22, graduation_cgpa = $23, graduation_documents = $24,
        post_graduation_board = $25, post_graduation_year = $26, post_graduation_cgpa = $27, post_graduation_documents = $28,
        phd_board = $29, phd_year = $30, phd_cgpa = $31, phd_documents = $32,
        certification_body = $33, certification_enrollment = $34, certification_year = $35, certification_valid_till = $36,
        research_papers = $37,
        prev_company1_name = $38, prev_company1_start_date = $39, prev_company1_end_date = $40,
        prev_company1_designation = $41, prev_company1_offer_letter = $42, prev_company1_releaving_letter = $43, prev_company1_pay_slips = $44,
        prev_company2_name = $45, prev_company2_start_date = $46, prev_company2_end_date = $47,
        prev_company2_designation = $48, prev_company2_offer_letter = $49, prev_company2_releaving_letter = $50, prev_company2_pay_slips = $51,
        updated_at = CURRENT_TIMESTAMP
      WHERE emp_id = $52
      RETURNING *
    `;
    
    const values = [
      data.photo, data.firstName, data.middleName, data.lastName,
      data.contact1, data.contact2, data.mailId1, data.mailId2,
      formatDate(data.dateOfJoining), data.designation, data.department, data.project,
      data.edu10thBoard, data.edu10thYear, data.edu10thCGPA, data.edu10thDocuments,
      data.edu12thBoard, data.edu12thYear, data.edu12thCGPA, data.edu12thDocuments,
      data.graduationBoard, data.graduationYear, data.graduationCGPA, data.graduationDocuments,
      data.postGraduationBoard, data.postGraduationYear, data.postGraduationCGPA, data.postGraduationDocuments,
      data.phdBoard, data.phdYear, data.phdCGPA, data.phdDocuments,
      data.certificationBody, data.certificationEnrollment, data.certificationYear, data.certificationValidTill,
      data.researchPapers,
      data.prevCompany1Name, formatDate(data.prevCompany1StartDate), formatDate(data.prevCompany1EndDate),
      data.prevCompany1Designation, data.prevCompany1OfferLetter, data.prevCompany1ReleavingLetter, data.prevCompany1PaySlips,
      data.prevCompany2Name, formatDate(data.prevCompany2StartDate), formatDate(data.prevCompany2EndDate),
      data.prevCompany2Designation, data.prevCompany2OfferLetter, data.prevCompany2ReleavingLetter, data.prevCompany2PaySlips,
      empId
    ];

    try {
      const result = await pool.query(query, values);
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error('Update error:', error);
      throw error;
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