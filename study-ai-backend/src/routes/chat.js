const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chatController');

// Main chat endpoint
router.post('/message', ChatController.chat);

// Get conversation history
router.get('/history', ChatController.getHistory);

// AI service health check
router.get('/health', ChatController.healthCheck);

// Get available models
router.get('/models', ChatController.getModels);

// Switch AI provider (for testing)
router.post('/provider', ChatController.switchProvider);

// Generate study materials
router.post('/generate', ChatController.generateStudyMaterials);

// Clear cache endpoint - CRITICAL for fixing deleted files issue
router.post('/clear-cache', ChatController.clearCache);

// Get current context status (for debugging)
router.get('/context-status', ChatController.getContextStatus);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    message: 'Chat routes are working!',
    timestamp: new Date().toISOString(),
    provider: process.env.AI_PROVIDER,
    endpoints: [
      'POST /api/chat/message - Send chat message',
      'GET /api/chat/health - Check AI service health',
      'GET /api/chat/models - Get available models',
      'POST /api/chat/provider - Switch AI provider',
      'POST /api/chat/generate - Generate study materials',
      'POST /api/chat/clear-cache - Clear document cache',
      'GET /api/chat/context-status - Check context status'
    ]
  });
});

module.exports = router;