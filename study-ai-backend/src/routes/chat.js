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

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    message: 'Chat routes are working!',
    timestamp: new Date().toISOString(),
    provider: process.env.AI_PROVIDER
  });
});

module.exports = router;