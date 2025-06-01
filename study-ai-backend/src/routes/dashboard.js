const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');

// Get comprehensive dashboard data
router.get('/stats', DashboardController.getDashboardData);

// Get specific statistics
router.get('/files', DashboardController.getFileStats);
router.get('/study', DashboardController.getStudyStats);
router.get('/content', DashboardController.getContentStats);
router.get('/activity', DashboardController.getRecentActivity);
router.get('/topics', DashboardController.getTopicsProgress);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    message: 'Dashboard routes are working!',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /api/dashboard/stats - Complete dashboard data',
      'GET /api/dashboard/files - File statistics',
      'GET /api/dashboard/study - Study statistics', 
      'GET /api/dashboard/content - Content analysis',
      'GET /api/dashboard/activity - Recent activity',
      'GET /api/dashboard/topics - Topics progress'
    ]
  });
});

module.exports = router;