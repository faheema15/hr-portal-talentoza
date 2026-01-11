// backend/controllers/offerLetterController.js
const OfferLetter = require('../models/OfferLetter');
const EmailService = require('../services/emailService');

// Get skip level manager email by emp_id
async function getSkipLevelManagerEmail(empId) {
  try {
    const db = require('../config/database');
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
    console.log('📝 saveOfferLetter - Request body:', req.body);
    
    const { name, mobile, address, email, employmentType, role, salary, pdfFileName } = req.body;

    // Validate required fields
    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, role'
      });
    }

    // Use model to create offer letter
    const offerLetter = await OfferLetter.create({
      name,
      mobile: mobile || null,
      address: address || null,
      email,
      employmentType: employmentType || 'full-time',
      role,
      salary: salary || null,
      offerLetterPdf: pdfFileName || null
    });

    console.log('✅ Offer letter saved with ID:', offerLetter.id);

    res.json({
      success: true,
      offerId: offerLetter.id,
      message: 'Offer letter saved successfully'
    });
  } catch (error) {
    console.error('❌ Error saving offer letter:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to save offer letter',
      details: error.message
    });
  }
}

// Send offer letter via email
async function sendOfferLetterEmail(req, res) {
  try {
    console.log('📧 sendOfferLetterEmail - Request body:', req.body);
    
    const { offerId, candidateEmail, candidateName, pdfBase64, pdfFileName, skipLevelManagerEmail } = req.body;

    // Validate required fields
    if (!offerId || !candidateEmail || !candidateName || !pdfBase64) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: offerId, candidateEmail, candidateName, pdfBase64'
      });
    }

    // Check if offer letter exists
    const offerLetter = await OfferLetter.getById(offerId);
    if (!offerLetter) {
      return res.status(404).json({
        success: false,
        error: 'Offer letter not found'
      });
    }

    console.log('📧 Sending email to:', candidateEmail, 'CC:', skipLevelManagerEmail);
    console.log('📄 PDF size:', Buffer.from(pdfBase64, 'base64').length, 'bytes');

    // Convert base64 to Buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // Send email using EmailService
    await EmailService.sendOfferLetterEmail(
      candidateEmail,
      pdfBuffer, // Now sending actual PDF buffer
      candidateName,
      skipLevelManagerEmail
    );

    // Update status using model
    const updated = await OfferLetter.updateStatus(offerId, 'Sent', {
      sentToEmail: candidateEmail,
      ccEmail: skipLevelManagerEmail || null
    });

    console.log('✅ Offer letter email sent and database updated');

    res.json({
      success: true,
      message: 'Offer letter sent successfully',
      data: updated,
      sentTo: candidateEmail,
      ccTo: skipLevelManagerEmail || 'None'
    });
  } catch (error) {
    console.error('❌ Error sending offer letter:', error);

    // Update status to Failed
    if (req.body.offerId) {
      try {
        await OfferLetter.updateStatus(req.body.offerId, 'Failed');
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
    console.log('📋 getOfferLetterHistory called');
    
    // Use model to fetch all
    const offerLetters = await OfferLetter.getAll(50, 0);

    console.log('✅ Fetched', offerLetters.length, 'offer letters');

    res.json({
      success: true,
      data: offerLetters,
      count: offerLetters.length
    });
  } catch (error) {
    console.error('❌ Error fetching offer letters:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch offer letters',
      details: error.message
    });
  }
}

// Update candidate response
async function updateCandidateResponse(req, res) {
  try {
    console.log('✅ updateCandidateResponse called');
    
    const { id } = req.params;
    const { candidateResponse } = req.body;

    // Validate response value
    if (!['Accepted', 'Rejected', 'Pending'].includes(candidateResponse)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid candidate response value. Must be Accepted, Rejected, or Pending'
      });
    }

    // Use model to update
    const updated = await OfferLetter.updateCandidateResponse(id, candidateResponse);

    console.log(`✅ Candidate response updated to: ${candidateResponse} for offer ID: ${id}`);

    res.json({
      success: true,
      message: `Candidate response updated to: ${candidateResponse}`,
      data: updated
    });
  } catch (error) {
    console.error('❌ Error updating candidate response:', error);
    
    // Check if it's a "not found" error
    if (error.message === 'Offer letter not found') {
      return res.status(404).json({
        success: false,
        error: 'Offer letter not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update candidate response',
      details: error.message
    });
  }
}

// Upload joining letter
async function uploadJoiningLetter(req, res) {
  try {
    console.log('📄 uploadJoiningLetter called');
    
    const { id } = req.params;
    const { joiningLetterUrl } = req.body;

    if (!joiningLetterUrl) {
      return res.status(400).json({
        success: false,
        error: 'Joining letter URL is required'
      });
    }

    // Use model to update
    const updated = await OfferLetter.uploadJoiningLetter(id, joiningLetterUrl);

    console.log(`✅ Joining letter uploaded for offer ID: ${id}`);

    res.json({
      success: true,
      message: 'Joining letter uploaded successfully',
      data: updated
    });
  } catch (error) {
    console.error('❌ Error uploading joining letter:', error);
    
    // Check if it's a "not found" error
    if (error.message === 'Offer letter not found') {
      return res.status(404).json({
        success: false,
        error: 'Offer letter not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload joining letter',
      details: error.message
    });
  }
}

module.exports = {
  saveOfferLetter,
  sendOfferLetterEmail,
  getOfferLetterHistory,
  getSkipLevelManagerEmail,
  updateCandidateResponse,
  uploadJoiningLetter
};