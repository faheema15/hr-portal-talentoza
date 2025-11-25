// backend/services/emailService.js
const nodemailer = require('nodemailer');
const pool = require('../config/database');

// Configure your email service
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

class EmailService {
  // Send leave approval email to HR and Manager
  static async sendLeaveApprovalEmail(leaveData, empData) {
    try {
      const leaveDays = this.calculateLeaveDays(
        leaveData.leaveFromDate,
        leaveData.leaveToDate
      );
      
      // Get HR and Manager emails
      const recipients = await this.getLeaveApprovalRecipients(
        empData.reporting_manager_id,
        leaveDays
      );
      
      if (recipients.length === 0) {
        console.warn('No recipients found for leave approval email');
        return;
      }

      const approvalLink = `${process.env.FRONTEND_URL}/leave-approval/${leaveData._id}`;
      
      const emailContent = this.generateLeaveApprovalEmail(
        empData,
        leaveData,
        leaveDays,
        approvalLink
      );

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipients.join(','),
        subject: `Leave Approval Required - ${empData.full_name} (${leaveDays} days)`,
        html: emailContent
      };

      await transporter.sendMail(mailOptions);
      console.log('Leave approval email sent to:', recipients);
      return true;
    } catch (error) {
      console.error('Error sending leave approval email:', error);
      throw error;
    }
  }

  // Get recipients based on leave duration
  static async getLeaveApprovalRecipients(managerId, leaveDays) {
    try {
      const recipients = [];

      // Always send to HR
      const hrQuery = 'SELECT email FROM users WHERE role = $1 AND is_active = true';
      const hrResult = await pool.query(hrQuery, ['HR']);
      hrResult.rows.forEach(row => recipients.push(row.email));

      // Send to reporting manager
      if (managerId) {
        const managerQuery = 'SELECT email FROM users WHERE id = $1 AND is_active = true';
        const managerResult = await pool.query(managerQuery, [managerId]);
        if (managerResult.rows.length > 0) {
          recipients.push(managerResult.rows[0].email);
        }
      }

      // If leave > 3 days, also send to skip level manager
      if (leaveDays > 3) {
        const skipManagerQuery = `
          SELECT DISTINCT u.email 
          FROM users u
          WHERE u.role = $1 AND u.is_active = true
          LIMIT 1
        `;
        const skipManagerResult = await pool.query(skipManagerQuery, ['Skip Manager']);
        if (skipManagerResult.rows.length > 0) {
          recipients.push(skipManagerResult.rows[0].email);
        }
      }

      // Remove duplicates
      return [...new Set(recipients)];
    } catch (error) {
      console.error('Error getting leave approval recipients:', error);
      throw error;
    }
  }

  // Generate HTML email content
  static generateLeaveApprovalEmail(empData, leaveData, leaveDays, approvalLink) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2c3e50; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #ecf0f1; padding: 20px; border-radius: 0 0 5px 5px; }
            .info-section { margin: 15px 0; }
            .info-label { font-weight: bold; color: #2c3e50; }
            .info-value { color: #555; margin-left: 10px; }
            .action-buttons { margin: 20px 0; text-align: center; }
            .btn { 
              display: inline-block; 
              padding: 12px 24px; 
              margin: 5px; 
              border-radius: 5px; 
              text-decoration: none; 
              font-weight: bold;
            }
            .btn-approve { background-color: #27ae60; color: white; }
            .btn-reject { background-color: #e74c3c; color: white; }
            .warning { background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 15px 0; }
            .footer { font-size: 12px; color: #7f8c8d; margin-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Leave Approval Request</h2>
            </div>
            
            <div class="content">
              <p>Hello,</p>
              
              <p>A new leave application requires your approval:</p>
              
              <div class="info-section">
                <span class="info-label">Employee Name:</span>
                <span class="info-value">${empData.full_name}</span>
              </div>
              
              <div class="info-section">
                <span class="info-label">Employee ID:</span>
                <span class="info-value">${empData.emp_id}</span>
              </div>
              
              <div class="info-section">
                <span class="info-label">Designation:</span>
                <span class="info-value">${empData.designation || 'N/A'}</span>
              </div>
              
              <div class="info-section">
                <span class="info-label">Department:</span>
                <span class="info-value">${empData.department || 'N/A'}</span>
              </div>
              
              <div class="info-section">
                <span class="info-label">Leave Type:</span>
                <span class="info-value">${leaveData.leaveApplyType}</span>
              </div>
              
              <div class="info-section">
                <span class="info-label">From Date:</span>
                <span class="info-value">${this.formatDate(leaveData.leaveFromDate)}</span>
              </div>
              
              <div class="info-section">
                <span class="info-label">To Date:</span>
                <span class="info-value">${this.formatDate(leaveData.leaveToDate)}</span>
              </div>
              
              <div class="info-section">
                <span class="info-label">Total Days:</span>
                <span class="info-value"><strong>${leaveDays} days</strong></span>
              </div>
              
              ${leaveData.reasonForLeave ? `
                <div class="info-section">
                  <span class="info-label">Reason for Leave:</span>
                  <span class="info-value">${leaveData.reasonForLeave}</span>
                </div>
              ` : ''}
              
              ${leaveDays > 3 ? `
                <div class="warning">
                  <strong>⚠️ Note:</strong> This leave is for more than 3 days and requires approval from HR, Reporting Manager, and Skip Level Manager.
                </div>
              ` : ''}
              
              <div class="action-buttons">
                <a href="${approvalLink}?action=approve" class="btn btn-approve">Approve Leave</a>
                <a href="${approvalLink}?action=reject" class="btn btn-reject">Reject Leave</a>
              </div>
              
              <p>Alternatively, you can <a href="${process.env.FRONTEND_URL}/leave">visit the Leave Management portal</a> to review and approve the request.</p>
              
              <div class="footer">
                <p>This is an automated email. Please do not reply directly.</p>
                <p>© ${new Date().getFullYear()} HR Portal. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Send leave approval/rejection confirmation to employee
  static async sendLeaveApprovalConfirmation(empData, leaveData, status) {
    try {
      const emailContent = this.generateApprovalConfirmationEmail(
        empData,
        leaveData,
        status
      );

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: empData.email1,
        subject: `Leave Request ${status} - ${leaveData.leaveApplyType}`,
        html: emailContent
      };

      await transporter.sendMail(mailOptions);
      console.log('Leave confirmation email sent to:', empData.email1);
      return true;
    } catch (error) {
      console.error('Error sending leave confirmation email:', error);
      throw error;
    }
  }

  // Generate confirmation email HTML
  static generateApprovalConfirmationEmail(empData, leaveData, status) {
    const isApproved = status === 'Approved';
    const statusColor = isApproved ? '#27ae60' : '#e74c3c';
    const statusMessage = isApproved 
      ? 'Your leave request has been approved.' 
      : 'Your leave request has been rejected.';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: ${statusColor}; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
            .content { background-color: #ecf0f1; padding: 20px; border-radius: 0 0 5px 5px; }
            .info-section { margin: 15px 0; }
            .info-label { font-weight: bold; color: #2c3e50; }
            .info-value { color: #555; margin-left: 10px; }
            .footer { font-size: 12px; color: #7f8c8d; margin-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">${isApproved ? '✓ Leave Approved' : '✗ Leave Rejected'}</h2>
            </div>
            
            <div class="content">
              <p>Dear ${empData.full_name},</p>
              
              <p>${statusMessage}</p>
              
              <div class="info-section">
                <span class="info-label">Leave Type:</span>
                <span class="info-value">${leaveData.leaveApplyType}</span>
              </div>
              
              <div class="info-section">
                <span class="info-label">From Date:</span>
                <span class="info-value">${this.formatDate(leaveData.leaveFromDate)}</span>
              </div>
              
              <div class="info-section">
                <span class="info-label">To Date:</span>
                <span class="info-value">${this.formatDate(leaveData.leaveToDate)}</span>
              </div>
              
              <p style="margin-top: 20px;">If you have any questions, please contact your HR department.</p>
              
              <div class="footer">
                <p>This is an automated email. Please do not reply directly.</p>
                <p>© ${new Date().getFullYear()} HR Portal. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Calculate leave days (excluding weekends if needed)
  static calculateLeaveDays(fromDate, toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const days = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
    return days;
  }

  // Format date for display
  static formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
  }

  // Test email functionality
  static async testEmailConnection() {
    try {
      await transporter.verify();
      console.log('Email service connected successfully');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }

  static async sendOfferLetterEmail(candidateEmail, pdfBuffer, candidateName, ccEmail) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: candidateEmail,
      cc: ccEmail || '',
      subject: `Offer Letter - ${candidateName}`,
      html: this.generateOfferLetterEmailContent(candidateName),
      attachments: [
        {
          filename: `offer-letter-${candidateName.replace(/\s+/g, '-')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Offer letter email sent to:', candidateEmail, 'CC:', ccEmail);
    return { success: true, recipient: candidateEmail, cc: ccEmail };
  } catch (error) {
    console.error('❌ Error sending offer letter email:', error);
    throw error;
  }
  }

  static generateOfferLetterEmailContent(candidateName) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2c3e50; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
            .content { background-color: #ecf0f1; padding: 20px; border-radius: 0 0 5px 5px; }
            .info-section { margin: 15px 0; }
            .highlight { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; border-radius: 3px; }
            .footer { font-size: 12px; color: #7f8c8d; margin-top: 20px; text-align: center; }
            .btn-text { color: #2c3e50; font-weight: bold; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">Welcome to Our Team! 🎉</h2>
              <p style="margin: 10px 0 0 0;">Offer Letter</p>
            </div>
            
            <div class="content">
              <p>Dear <strong>${candidateName}</strong>,</p>
              
              <p>We are delighted to extend an offer of employment to you. We believe you will be a valuable addition to our team.</p>
              
              <div class="highlight">
                <strong>📎 Offer Letter Attached</strong><br>
                Please find the detailed offer letter attached to this email. Please review it carefully and confirm your acceptance within <strong>5 business days</strong>.
              </div>
              
              <div class="info-section">
                <p><strong>What's next?</strong></p>
                <ul>
                  <li>Review the attached offer letter thoroughly</li>
                  <li>Confirm your acceptance via email or portal</li>
                  <li>Complete any pre-joining formalities as mentioned in the offer</li>
                  <li>Contact HR if you have any questions</li>
                </ul>
              </div>
              
              <div class="info-section">
                <p><strong>Important Notes:</strong></p>
                <ul>
                  <li>This offer is contingent upon successful background verification and medical examination</li>
                  <li>Please ensure all information in the offer letter is accurate</li>
                  <li>If any details need correction, please inform HR immediately</li>
                </ul>
              </div>
              
              <p>If you have any questions or need clarification on any point, please don't hesitate to reach out to our HR department.</p>
              
              <p style="margin-top: 30px;">
                <strong>Best Regards,</strong><br>
                <strong>HR Department</strong><br>
                Company Name
              </p>
              
              <div class="footer">
                <p>This is an automated email. Please do not reply directly to this email.</p>
                <p>© ${new Date().getFullYear()} HR Portal. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static async sendJoiningLetterEmail(candidateEmail, candidateName, joiningDate) {
  try {
    const emailContent = this.generateJoiningLetterEmailContent(candidateName, joiningDate);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: candidateEmail,
      subject: `Welcome Aboard! Your Joining Letter - ${candidateName}`,
      html: emailContent
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Joining letter email sent to:', candidateEmail);
    return { success: true, recipient: candidateEmail };
  } catch (error) {
    console.error('❌ Error sending joining letter email:', error);
    throw error;
  }
  }

  static generateJoiningLetterEmailContent(candidateName, joiningDate) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #27ae60; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
            .content { background-color: #ecf0f1; padding: 20px; border-radius: 0 0 5px 5px; }
            .highlight { background-color: #d5f4e6; padding: 15px; border-left: 4px solid #27ae60; margin: 15px 0; border-radius: 3px; }
            .footer { font-size: 12px; color: #7f8c8d; margin-top: 20px; text-align: center; }
            ul { margin: 10px 0; padding-left: 20px; }
            li { margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">Welcome Aboard! 🎉</h2>
              <p style="margin: 10px 0 0 0;">We're excited to have you join our team</p>
            </div>
            
            <div class="content">
              <p>Dear <strong>${candidateName}</strong>,</p>
              
              <p>Congratulations on your acceptance of our offer! We are thrilled that you have decided to join us.</p>
              
              <div class="highlight">
                <strong>📅 Joining Date:</strong> <strong>${new Date(joiningDate).toLocaleDateString('en-IN')}</strong>
                <p style="margin-top: 10px; margin-bottom: 0;">Please mark this date in your calendar and ensure all pre-joining formalities are completed.</p>
              </div>
              
              <p><strong>Please note:</strong></p>
              <ul>
                <li>Report to HR on or before your joining date</li>
                <li>Bring all original documents for verification</li>
                <li>Complete the onboarding process as per HR instructions</li>
                <li>An induction schedule will be shared with you shortly</li>
                <li>Contact HR if you have any queries before joining</li>
              </ul>
              
              <p><strong>Documents to bring:</strong></p>
              <ul>
                <li>Original Aadhar, PAN, and Passport (if applicable)</li>
                <li>Latest relieving letter from previous employer</li>
                <li>Medical fitness certificate</li>
                <li>Two passport-size photographs</li>
                <li>Any other documents as mentioned in the offer letter</li>
              </ul>
              
              <p style="margin-top: 30px;">
                If you have any questions or need any assistance, please feel free to contact our HR department.
              </p>
              
              <p style="margin-top: 20px;">
                <strong>Best Regards,</strong><br>
                <strong>HR Department</strong><br>
                Company Name
              </p>
              
              <div class="footer">
                <p>This is an automated email. Please do not reply directly.</p>
                <p>© ${new Date().getFullYear()} HR Portal. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

}

module.exports = EmailService;