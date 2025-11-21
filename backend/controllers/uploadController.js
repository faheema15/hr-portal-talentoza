// backend/controllers/uploadController.js
const path = require('path');
const pool = require('../config/database');

exports.uploadEmployeePhoto = async (req, res) => {
  try {
    const { id } = req.params; // emp_id from URL
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Construct the photo URL based on environment
    let photoUrl;
    
    if (process.env.NODE_ENV === 'production') {
      // Production: Use GCS URL (already set by middleware)
      photoUrl = req.file.gcsUrl;
    } else {
      // Local development: Use relative path
      photoUrl = `/uploads/employee-photos/${req.file.filename}`;
    }

    console.log('Photo URL:', photoUrl);

    res.status(200).json({
      success: true,
      message: 'Photo uploaded successfully',
      data: {
        photo_url: photoUrl,
        filename: req.file.filename
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading photo',
      error: error.message
    });
  }
};