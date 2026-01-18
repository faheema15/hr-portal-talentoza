// backend/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../controllers/authController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const isProduction = process.env.NODE_ENV === 'production';

// ============================================
// DOCUMENT UPLOAD (Generic for all documents)
// ============================================

let documentUpload;
let documentUploadToGCS;

if (isProduction) {
  // Production: Google Cloud Storage
  const { Storage } = require('@google-cloud/storage');
  
  const storage = new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    keyFilename: process.env.GCS_KEY_FILE
  });

  const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
  
  const gcsStorage = multer.memoryStorage();
  
  documentUpload = multer({
    storage: gcsStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for documents
    fileFilter: (req, file, cb) => {
      const allowedTypes = /pdf|doc|docx|jpg|jpeg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.includes('document');
      
      if (mimetype && extname) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF, DOC, DOCX, and image files are allowed!'));
      }
    }
  });

  documentUploadToGCS = async (req, res, next) => {
    if (!req.file) return next();

    try {
      const fieldName = req.body.fieldName || 'document';
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(req.file.originalname);
      const filename = `documents/${fieldName}_${uniqueSuffix}${ext}`;

      const blob = bucket.file(filename);
      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: {
          contentType: req.file.mimetype
        }
      });

      blobStream.on('error', (err) => next(err));

      blobStream.on('finish', () => {
        blob.makePublic().then(() => {
          req.file.gcsUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
          req.file.gcsFilename = filename;
          next();
        }).catch(next);
      });

      blobStream.end(req.file.buffer);
    } catch (error) {
      next(error);
    }
  };

} else {
  // Local Development
  const uploadDir = path.join(__dirname, '../uploads/documents');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const localStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const fieldName = req.body.fieldName || 'document';
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `${fieldName}_${uniqueSuffix}${ext}`);
    }
  });

  documentUpload = multer({
    storage: localStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
      const allowedTypes = /pdf|doc|docx|jpg|jpeg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.includes('document');
      
      if (mimetype && extname) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF, DOC, DOCX, and image files are allowed!'));
      }
    }
  });

  documentUploadToGCS = (req, res, next) => next();
}

// ============================================
// ROUTES
// ============================================

// Generic document upload endpoint
router.post('/document', verifyToken, documentUpload.single('file'), documentUploadToGCS, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    let fileUrl;
    let filename;

    if (isProduction) {
      fileUrl = req.file.gcsUrl;
      filename = req.file.gcsFilename;
    } else {
      fileUrl = `/uploads/documents/${req.file.filename}`;
      filename = req.file.filename;
    }

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        file_url: fileUrl,
        filename: filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
});

// Delete document
router.delete('/document/:filename', verifyToken, async (req, res) => {
  try {
    const filename = req.params.filename;

    if (isProduction) {
      const { Storage } = require('@google-cloud/storage');
      const storage = new Storage({
        projectId: process.env.GCS_PROJECT_ID,
        keyFilename: process.env.GCS_KEY_FILE
      });
      const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
      
      await bucket.file(filename).delete();
      
      res.status(200).json({
        success: true,
        message: 'File deleted successfully from GCS'
      });
    } else {
      const filePath = path.join(__dirname, '../uploads/documents', filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.status(200).json({
          success: true,
          message: 'File deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }
    }

  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
});

// Employee photo upload (keeping existing functionality)
router.post('/employee-photo/:id', verifyToken, 
  require('../middleware/upload').upload.single('photo'), 
  require('../middleware/upload').uploadToGCS, 
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      let photoUrl;
      let filename;

      if (isProduction) {
        photoUrl = req.file.gcsUrl;
        filename = req.file.gcsFilename;
      } else {
        photoUrl = `/uploads/employee-photos/${req.file.filename}`;
        filename = req.file.filename;
      }

      res.status(200).json({
        success: true,
        message: 'Photo uploaded successfully',
        data: {
          photo_url: photoUrl,
          filename: filename
        }
      });

    } catch (error) {
      console.error('Error uploading photo:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading photo',
        error: error.message
      });
    }
});

// Upload document for education/certification/research
router.post('/document', verifyToken, documentUpload.single('file'), documentUploadToGCS, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    let fileUrl;
    let filename;

    if (isProduction) {
      fileUrl = req.file.gcsUrl;
      filename = req.file.gcsFilename;
    } else {
      fileUrl = `/uploads/documents/${req.file.filename}`;
      filename = req.file.filename;
    }

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        file_url: fileUrl,
        filename: filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
});

// Delete document
router.delete('/document/:filename', verifyToken, async (req, res) => {
  try {
    const filename = req.params.filename;

    if (isProduction) {
      const { Storage } = require('@google-cloud/storage');
      const storage = new Storage({
        projectId: process.env.GCS_PROJECT_ID,
        keyFilename: process.env.GCS_KEY_FILE
      });
      const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
      
      await bucket.file(filename).delete();
      
      res.status(200).json({
        success: true,
        message: 'File deleted successfully from GCS'
      });
    } else {
      const filePath = path.join(__dirname, '../uploads/documents', filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.status(200).json({
          success: true,
          message: 'File deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }
    }

  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
});

module.exports = router;