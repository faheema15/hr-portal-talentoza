const db = require('../config/database');
const EmailService = require('../services/emailService');
const fs = require('fs');
const path = require('path');

// Get skip level manager email by emp_id
async function getSkipLevelManagerEmail(empId) {
  try {
    // Query to get skip level manager email
    const query = `
      SELECT u.email, u.name
      FROM users u
      INNER JOIN employee_details ed ON u.id = ed.user_id
      WHERE ed.emp_id = (
        SELECT reporting_manager_id
        FROM employee_details
        WHERE emp_id = $1
      )
    `;
    
    const result = await db.query(query, [empId]);
    
    if (result.rows.length > 0) {
      console.log('✅ Skip level manager found:', result.rows[0].email);
      return result.rows[0].email;
    }
    
    console.warn('⚠️ No skip level manager found for emp_id:', empId);
    return null;
  } catch (error) {
    console.error('❌ Error fetching skip level manager email:', error);
    return null;
  }
}

// Save offer letter to database
async function saveOfferLetter(req, res) {
  try {
    const { name, mobile, address, email, employmentType, role, salary, pdfFileName } = req.body;

    const query = `
      INSERT INTO offer_letters 
      (name, mobile, address, email, employment_type, role, salary, offer_letter_pdf, status) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, created_at
    `;

    const result = await db.query(query, [
      name,
      mobile,
      address,
      email,
      employmentType,
      role,
      salary || null,
      pdfFileName,
      'Draft'
    ]);

    res.json({
      success: true,
      offerId: result.rows[0].id,
      message: 'Offer letter saved successfully'
    });
  } catch (error) {
    console.error('❌ Error saving offer letter:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to save offer letter' 
    });
  }
}

// Send offer letter via email using existing EmailService
async function sendOfferLetterEmail(req, res) {
  try {
    const { offerId, candidateEmail, candidateName, pdfFileName, skipLevelManagerEmail } = req.body;

    // Construct PDF path
    const pdfPath = path.join(__dirname, '../uploads/offer-letters', pdfFileName);

    // Check if PDF exists
    if (!fs.existsSync(pdfPath)) {
      return res.status(400).json({ 
        success: false,
        error: 'PDF file not found. Please generate the offer letter first.' 
      });
    }

    // Read PDF file
    const pdfBuffer = fs.readFileSync(pdfPath);

    // Send email using existing EmailService
    const emailResult = await EmailService.sendOfferLetterEmail(
      candidateEmail,
      pdfBuffer,
      candidateName,
      skipLevelManagerEmail
    );

    // Update database status
    const updateQuery = `
      UPDATE offer_letters 
      SET status = $1, sent_to_email = $2, cc_email = $3, sent_date = NOW() 
      WHERE id = $4
    `;

    await db.query(updateQuery, [
      'Sent',
      candidateEmail,
      skipLevelManagerEmail || null,
      offerId
    ]);

    console.log('✅ Offer letter email sent and database updated');

    res.json({
      success: true,
      message: 'Offer letter sent successfully',
      sentTo: candidateEmail,
      ccTo: skipLevelManagerEmail || 'None'
    });
  } catch (error) {
    console.error('❌ Error sending offer letter:', error);

    // Update database status to Failed
    if (req.body.offerId) {
      try {
        await db.query(
          `UPDATE offer_letters SET status = $1 WHERE id = $2`,
          ['Failed', req.body.offerId]
        );
      } catch (updateError) {
        console.error('Error updating offer letter status:', updateError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to send offer letter',
      details: error.message
    });
  }
}

// Get offer letter history
async function getOfferLetterHistory(req, res) {
  try {
    const query = `
      SELECT * FROM offer_letters 
      ORDER BY created_at DESC 
      LIMIT 50
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Error fetching offer letters:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch offer letters' 
    });
  }
}


const updateCandidateResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { candidateResponse } = req.body;

    // Validate response value
    if (!['Accepted', 'Rejected', 'Pending'].includes(candidateResponse)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid candidate response value'
      });
    }

    // Update database
    const query = `
      UPDATE offer_letters 
      SET candidate_response = $1, response_date = NOW(), updated_at = NOW() 
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(query, [candidateResponse, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Offer letter not found'
      });
    }

    console.log(`✅ Candidate response updated to: ${candidateResponse} for offer ID: ${id}`);

    res.json({
      success: true,
      message: `Candidate response updated to: ${candidateResponse}`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error updating candidate response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update candidate response',
      details: error.message
    });
  }
};

const uploadJoiningLetter = async (req, res) => {
  try {
    const { id } = req.params;
    const joiningLetterUrl = req.body.joiningLetterUrl;

    if (!joiningLetterUrl) {
      return res.status(400).json({
        success: false,
        error: 'Joining letter URL is required'
      });
    }

    const query = `
      UPDATE offer_letters 
      SET joining_letter_url = $1, updated_at = NOW() 
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(query, [joiningLetterUrl, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Offer letter not found'
      });
    }

    console.log(`✅ Joining letter uploaded for offer ID: ${id}`);

    res.json({
      success: true,
      message: 'Joining letter uploaded successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error uploading joining letter:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload joining letter',
      details: error.message
    });
  }
};


module.exports = {
  saveOfferLetter,
  sendOfferLetterEmail,
  getOfferLetterHistory,
  getSkipLevelManagerEmail,
  updateCandidateResponse,   
  uploadJoiningLetter 
};

