// backend/routes/educationRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all education details for an employee
router.get('/:emp_id', async (req, res) => {
  try {
    const { emp_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM educational_details WHERE emp_id = $1 ORDER BY year_of_passing DESC',
      [emp_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching education:', error);
    res.status(500).json({ success: false, message: 'Error fetching education details' });
  }
});

// Add new education
router.post('/', async (req, res) => {
  try {
    const { emp_id, level, board_university, year_of_passing, cgpa, document_url } = req.body;
    
    const result = await pool.query(
      `INSERT INTO educational_details (emp_id, level, board_university, year_of_passing, cgpa, document_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [emp_id, level, board_university, year_of_passing, cgpa, document_url]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error adding education:', error);
    res.status(500).json({ success: false, message: 'Error adding education' });
  }
});

// Delete education
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM educational_details WHERE id = $1', [id]);
    res.json({ success: true, message: 'Education deleted successfully' });
  } catch (error) {
    console.error('Error deleting education:', error);
    res.status(500).json({ success: false, message: 'Error deleting education' });
  }
});

module.exports = router;