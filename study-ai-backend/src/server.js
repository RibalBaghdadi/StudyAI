const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

// Import routes
const uploadRoutes = require('./routes/upload');
const chatRoutes = require('./routes/chat');
const dashboardRoutes = require('./routes/dashboard');
const documentsRoutes = require('./routes/documents');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Compression middleware
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/documents', documentsRoutes);

// Debug route
app.get('/api/debug', (req, res) => {
  res.json({
    message: 'Debug route working',
    chatRoutes: 'Chat routes should be available at /api/chat/*',
    availableRoutes: [
      'GET /api/chat/test',
      'POST /api/chat/message',
      'GET /api/chat/health',
      'GET /api/documents/list',
      'GET /api/documents/:id/content',
      'GET /api/documents/:id/summary',
      'GET /api/documents/:id/context',
      'GET /api/documents/delete/info',
      'DELETE /api/documents/:id',
      'DELETE /api/documents/',
      'DELETE /api/documents/bulk-delete'
    ]
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'StudyAI Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    error: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 StudyAI Backend Server Started');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📁 Upload directory: ${process.env.UPLOAD_PATH}`);
  console.log(`🔗 CORS origin: ${process.env.CORS_ORIGIN}`);
});

module.exports = app;