// backend/index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

console.log('🚀 Starting server...');
console.log('📝 Environment variables loaded');

const app = express();

// ============================================
// CORS Configuration
// ============================================
const allowedOrigins = [
  'http://localhost:3000',        // Local development
  'http://localhost:5173',        // Vite dev server
  process.env.FRONTEND_URL,       // Production frontend from .env
].filter(Boolean); // Remove undefined values

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

console.log('✅ CORS configured for origins:', allowedOrigins);

// Middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

console.log('✅ Middleware configured');

// ============================================
// Serve static files for uploads (local development only)
// ============================================
if (process.env.NODE_ENV !== 'production') {
  const uploadsPath = path.join(__dirname, 'uploads');
  app.use('/uploads', express.static(uploadsPath));
  console.log('✅ Static file serving enabled at /uploads');
  console.log('📁 Uploads directory:', uploadsPath);
  
  app.use('/uploads', (req, res, next) => {
    console.log(`📄 Static file request: ${req.url}`);
    next();
  });
}
// ============================================

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'HR Portal API is running' });
});

// Import routes
try {
  const routes = require('./routes');
  app.use('/api', routes);
  console.log('✅ Routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error.message);
  console.error(error.stack);
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log('\nPress Ctrl+C to stop\n');
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});