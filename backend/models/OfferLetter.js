// backend/models/OfferLetter.js
const db = require('../config/database');

class OfferLetter {
  /**
   * Create new offer letter record
   * @param {Object} data - Offer letter data
   * @returns {Promise<Object>} Created offer letter
   */
  static async create(data) {
    try {
      const {
        name,
        mobile,
        address,
        email,
        employmentType,
        role,
        salary,
        offerLetterPdf,
      } = data;

      const query = `
        INSERT INTO offer_letters 
        (name, mobile, address, email, employment_type, role, salary, offer_letter_pdf, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const result = await db.query(query, [
        name,
        mobile,
        address,
        email,
        employmentType,
        role,
        salary || null,
        offerLetterPdf,
        'Draft'
      ]);

      if (result.rows.length === 0) {
        throw new Error('Failed to create offer letter');
      }

      console.log('✅ Offer letter created:', result.rows[0].id);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in OfferLetter.create:', error);
      throw error;
    }
  }

  /**
   * Get offer letter by ID
   * @param {number} id - Offer letter ID
   * @returns {Promise<Object>} Offer letter record
   */
  static async getById(id) {
    try {
      const query = `
        SELECT * FROM offer_letters WHERE id = $1
      `;

      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        console.warn('⚠️ Offer letter not found:', id);
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in OfferLetter.getById:', error);
      throw error;
    }
  }

  /**
   * Get all offer letters with pagination
   * @param {number} limit - Number of records to fetch
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} Array of offer letters
   */
  static async getAll(limit = 50, offset = 0) {
    try {
      const query = `
        SELECT * FROM offer_letters 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `;

      const result = await db.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error in OfferLetter.getAll:', error);
      throw error;
    }
  }

  /**
   * Get offer letters by status
   * @param {string} status - Status (Draft/Sent/Failed)
   * @returns {Promise<Array>} Filtered offer letters
   */
  static async getByStatus(status) {
    try {
      const query = `
        SELECT * FROM offer_letters 
        WHERE status = $1 
        ORDER BY created_at DESC
      `;

      const result = await db.query(query, [status]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error in OfferLetter.getByStatus:', error);
      throw error;
    }
  }

  /**
   * Get offer letters by candidate response
   * @param {string} response - Response (Accepted/Rejected/Pending)
   * @returns {Promise<Array>} Filtered offer letters
   */
  static async getByResponse(response) {
    try {
      const query = `
        SELECT * FROM offer_letters 
        WHERE candidate_response = $1 
        ORDER BY response_date DESC
      `;

      const result = await db.query(query, [response]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error in OfferLetter.getByResponse:', error);
      throw error;
    }
  }

  /**
   * Update offer letter status
   * @param {number} id - Offer letter ID
   * @param {string} status - New status
   * @param {Object} sendDetails - Email send details
   * @returns {Promise<Object>} Updated offer letter
   */
  static async updateStatus(id, status, sendDetails = {}) {
    try {
      const {
        sentToEmail = null,
        ccEmail = null
      } = sendDetails;

      const query = `
        UPDATE offer_letters 
        SET 
          status = $1,
          sent_to_email = $2,
          cc_email = $3,
          sent_date = NOW(),
          updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `;

      const result = await db.query(query, [
        status,
        sentToEmail,
        ccEmail,
        id
      ]);

      if (result.rows.length === 0) {
        throw new Error('Offer letter not found');
      }

      console.log(`✅ Offer letter status updated to: ${status}`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in OfferLetter.updateStatus:', error);
      throw error;
    }
  }

  /**
   * Update candidate response
   * @param {number} id - Offer letter ID
   * @param {string} response - Candidate response (Accepted/Rejected/Pending)
   * @returns {Promise<Object>} Updated offer letter
   */
  static async updateCandidateResponse(id, response) {
    try {
      if (!['Accepted', 'Rejected', 'Pending'].includes(response)) {
        throw new Error('Invalid candidate response value');
      }

      const query = `
        UPDATE offer_letters 
        SET 
          candidate_response = $1,
          response_date = NOW(),
          updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const result = await db.query(query, [response, id]);

      if (result.rows.length === 0) {
        throw new Error('Offer letter not found');
      }

      console.log(`✅ Candidate response updated to: ${response}`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in OfferLetter.updateCandidateResponse:', error);
      throw error;
    }
  }

  /**
   * Upload joining letter
   * @param {number} id - Offer letter ID
   * @param {string} joiningLetterUrl - Joining letter URL
   * @returns {Promise<Object>} Updated offer letter
   */
  static async uploadJoiningLetter(id, joiningLetterUrl) {
    try {
      const query = `
        UPDATE offer_letters 
        SET 
          joining_letter_url = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const result = await db.query(query, [joiningLetterUrl, id]);

      if (result.rows.length === 0) {
        throw new Error('Offer letter not found');
      }

      console.log(`✅ Joining letter uploaded for ID: ${id}`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in OfferLetter.uploadJoiningLetter:', error);
      throw error;
    }
  }

  /**
   * Get offer letters by email
   * @param {string} email - Candidate email
   * @returns {Promise<Array>} Offer letters for email
   */
  static async getByEmail(email) {
    try {
      const query = `
        SELECT * FROM offer_letters 
        WHERE email = $1 
        ORDER BY created_at DESC
      `;

      const result = await db.query(query, [email]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error in OfferLetter.getByEmail:', error);
      throw error;
    }
  }

  /**
   * Get count of offer letters
   * @param {string} status - Optional status filter
   * @returns {Promise<number>} Count of offer letters
   */
  static async count(status = null) {
    try {
      let query = 'SELECT COUNT(*) FROM offer_letters';
      let params = [];

      if (status) {
        query += ' WHERE status = $1';
        params = [status];
      }

      const result = await db.query(query, params);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error('❌ Error in OfferLetter.count:', error);
      throw error;
    }
  }

  /**
   * Get statistics for dashboard
   * @returns {Promise<Object>} Statistics
   */
  static async getStatistics() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_offers,
          SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) as draft_count,
          SUM(CASE WHEN status = 'Sent' THEN 1 ELSE 0 END) as sent_count,
          SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) as failed_count,
          SUM(CASE WHEN candidate_response = 'Accepted' THEN 1 ELSE 0 END) as accepted_count,
          SUM(CASE WHEN candidate_response = 'Rejected' THEN 1 ELSE 0 END) as rejected_count,
          SUM(CASE WHEN candidate_response = 'Pending' THEN 1 ELSE 0 END) as pending_count
        FROM offer_letters
      `;

      const result = await db.query(query);
      
      const stats = result.rows[0];
      console.log('✅ Statistics retrieved:', stats);
      
      return {
        totalOffers: parseInt(stats.total_offers, 10),
        draft: parseInt(stats.draft_count, 10) || 0,
        sent: parseInt(stats.sent_count, 10) || 0,
        failed: parseInt(stats.failed_count, 10) || 0,
        accepted: parseInt(stats.accepted_count, 10) || 0,
        rejected: parseInt(stats.rejected_count, 10) || 0,
        pending: parseInt(stats.pending_count, 10) || 0
      };
    } catch (error) {
      console.error('❌ Error in OfferLetter.getStatistics:', error);
      throw error;
    }
  }

  /**
   * Delete offer letter (soft delete recommended)
   * @param {number} id - Offer letter ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      // Soft delete - just mark as inactive
      const query = `
        UPDATE offer_letters 
        SET updated_at = NOW()
        WHERE id = $1
        RETURNING id
      `;

      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        console.warn('⚠️ Offer letter not found for deletion:', id);
        return false;
      }

      console.log('✅ Offer letter deleted:', id);
      return true;
    } catch (error) {
      console.error('❌ Error in OfferLetter.delete:', error);
      throw error;
    }
  }

  /**
   * Search offer letters
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Search results
   */
  static async search(searchTerm) {
    try {
      const query = `
        SELECT * FROM offer_letters 
        WHERE 
          name ILIKE $1 OR 
          email ILIKE $1 OR 
          role ILIKE $1
        ORDER BY created_at DESC
      `;

      const searchPattern = `%${searchTerm}%`;
      const result = await db.query(query, [searchPattern]);
      
      console.log(`✅ Search completed for: ${searchTerm}`);
      return result.rows;
    } catch (error) {
      console.error('❌ Error in OfferLetter.search:', error);
      throw error;
    }
  }

  /**
   * Get accepted offers ready for joining letter
   * @returns {Promise<Array>} Accepted offers without joining letter
   */
  static async getAcceptedWithoutJoiningLetter() {
    try {
      const query = `
        SELECT * FROM offer_letters 
        WHERE 
          candidate_response = 'Accepted' 
          AND joining_letter_url IS NULL
        ORDER BY response_date ASC
      `;

      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ Error in OfferLetter.getAcceptedWithoutJoiningLetter:', error);
      throw error;
    }
  }
}

module.exports = OfferLetter;