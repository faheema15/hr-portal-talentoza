// backend/routes/offerLetterRoutes.js
const express = require('express');
const router = express.Router();
const offerLetterController = require('../controllers/offerLetterController');

router.post('/save', offerLetterController.saveOfferLetter);
router.post('/send', offerLetterController.sendOfferLetterEmail);
router.get('/history', offerLetterController.getOfferLetterHistory);
router.put('/:id/response', offerLetterController.updateCandidateResponse);
router.put('/:id/joining-letter', offerLetterController.uploadJoiningLetter);

module.exports = router;