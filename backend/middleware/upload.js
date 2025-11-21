//backed/middleware/upload.js
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Check if running in production
const isProduction = process.env.NODE_ENV === 'production';

// ============================================
// PRODUCTION: Google Cloud Storage
// ============================================
if (isProduction) {
  // Initialize GCS
  const storage = new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    keyFilename: process.env.GCS_KEY_FILE, // Path to service account JSON
    // OR use credentials directly:
    // credentials: JSON.parse(process.env.GCS_CREDENTIALS)
  });

  const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

  // Custom storage engine for GCS
  const gcsStorage = multer.memoryStorage(); // Store in memory first

  const upload = multer({
    storage: gcsStorage,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);

      if (mimetype && extname) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'));
      }
    }
  });

  // Middleware to upload to GCS after multer processes the file
  const uploadToGCS = async (req, res, next) => {
    if (!req.file) return next();

    try {
      const empId = req.params.id || req.body.emp_id || 'temp';
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(req.file.originalname);
      const filename = `employee-photos/${empId}_${uniqueSuffix}${ext}`;

      const blob = bucket.file(filename);
      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: {
          contentType: req.file.mimetype,
          metadata: {
            firebaseStorageDownloadTokens: uniqueSuffix // For Firebase compatibility if needed
          }
        }
      });

      blobStream.on('error', (err) => {
        next(err);
      });

      blobStream.on('finish', () => {
        // Make the file public (optional)
        blob.makePublic().then(() => {
          // Construct public URL
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

  module.exports = { upload, uploadToGCS };
}

// ============================================
// LOCAL DEVELOPMENT: File System Storage
// ============================================
else {
  const fs = require('fs');

  // Ensure upload directory exists
  const uploadDir = path.join(__dirname, '../uploads/employee-photos');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Configure local storage
  const localStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const empId = req.params.id || req.body.emp_id || 'temp';
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `${empId}_${uniqueSuffix}${ext}`);
    }
  });

  const upload = multer({
    storage: localStorage,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);

      if (mimetype && extname) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'));
      }
    }
  });

  // No-op middleware for local development
  const uploadToGCS = (req, res, next) => next();

  module.exports = { upload, uploadToGCS };
}