const express = require('express');
const router = express.Router();
const joiningDetailsController = require('../controllers/joiningDetailsController');

// Create new joining details
router.post('/', joiningDetailsController.createJoiningDetails);

// Get all joining details
router.get('/', joiningDetailsController.getAllJoiningDetails);

// Get joining details by ID
router.get('/:id', joiningDetailsController.getJoiningDetailsById);

// Update joining details
router.put('/:id', joiningDetailsController.updateJoiningDetails);

// Delete joining details
router.delete('/:id', joiningDetailsController.deleteJoiningDetails);

module.exports = router;