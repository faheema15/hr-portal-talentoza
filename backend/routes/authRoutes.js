// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Protected routes (require authentication)
router.get('/me', authController.verifyToken, authController.getCurrentUser);

module.exports = router;