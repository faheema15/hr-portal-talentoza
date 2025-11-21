// backend/routes/certificationRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all certifications for an employee
router.get('/:emp_id', async (req, res) => {
  try {
    const { emp_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM certifications WHERE emp_id = $1 ORDER BY year_of_passing DESC',
      [emp_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching certifications:', error);
    res.status(500).json({ success: false, message: 'Error fetching certifications' });
  }
});

// Add new certification
router.post('/', async (req, res) => {
  try {
    const { emp_id, exam_body, registration_no, year_of_passing, has_expiry, valid_till, certificate } = req.body;
    
    const result = await pool.query(
      `INSERT INTO certifications (emp_id, exam_body, registration_no, year_of_passing, has_expiry, valid_till, certificate)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [emp_id, exam_body, registration_no, year_of_passing, has_expiry, valid_till, certificate]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error adding certification:', error);
    res.status(500).json({ success: false, message: 'Error adding certification' });
  }
});

// Delete certification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM certifications WHERE id = $1', [id]);
    res.json({ success: true, message: 'Certification deleted successfully' });
  } catch (error) {
    console.error('Error deleting certification:', error);
    res.status(500).json({ success: false, message: 'Error deleting certification' });
  }
});

module.exports = router;