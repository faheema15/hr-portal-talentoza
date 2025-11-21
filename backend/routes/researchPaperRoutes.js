// backend/routes/researchPaperRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all research papers for an employee
router.get('/:emp_id', async (req, res) => {
  try {
    const { emp_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM research_papers WHERE emp_id = $1 ORDER BY publication_date DESC',
      [emp_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching research papers:', error);
    res.status(500).json({ success: false, message: 'Error fetching research papers' });
  }
});

// Add new research paper
router.post('/', async (req, res) => {
  try {
    const { emp_id, title, publication_name, publication_date, doi_link, research_paper } = req.body;
    
    const result = await pool.query(
      `INSERT INTO research_papers (emp_id, title, publication_name, publication_date, doi_link, research_paper)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [emp_id, title, publication_name, publication_date, doi_link, research_paper]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error adding research paper:', error);
    res.status(500).json({ success: false, message: 'Error adding research paper' });
  }
});

// Delete research paper
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM research_papers WHERE id = $1', [id]);
    res.json({ success: true, message: 'Research paper deleted successfully' });
  } catch (error) {
    console.error('Error deleting research paper:', error);
    res.status(500).json({ success: false, message: 'Error deleting research paper' });
  }
});

module.exports = router;