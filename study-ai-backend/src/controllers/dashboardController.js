const dashboardService = require('../services/dashboardService');

class DashboardController {
  /**
   * Get comprehensive dashboard statistics
   */
  static async getDashboardData(req, res) {
    try {
      const dashboardData = await dashboardService.getDashboardStats();
      
      res.json({
        success: true,
        data: dashboardData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Dashboard data error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard data',
        message: error.message
      });
    }
  }

  /**
   * Get file statistics only
   */
  static async getFileStats(req, res) {
    try {
      const fileStats = await dashboardService.getFileStatistics();
      
      res.json({
        success: true,
        data: fileStats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('File stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch file statistics',
        message: error.message
      });
    }
  }

  /**
   * Get study statistics only
   */
  static async getStudyStats(req, res) {
    try {
      const studyStats = await dashboardService.getStudyStatistics();
      
      res.json({
        success: true,
        data: studyStats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Study stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch study statistics',
        message: error.message
      });
    }
  }

  /**
   * Get content analysis
   */
  static async getContentStats(req, res) {
    try {
      const contentStats = await dashboardService.getContentStatistics();
      
      res.json({
        success: true,
        data: contentStats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Content stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch content statistics',
        message: error.message
      });
    }
  }

  /**
   * Get recent activity feed
   */
  static async getRecentActivity(req, res) {
    try {
      const activity = await dashboardService.getRecentActivity();
      
      res.json({
        success: true,
        data: activity,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Recent activity error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recent activity',
        message: error.message
      });
    }
  }

  /**
   * Get topics progress
   */
  static async getTopicsProgress(req, res) {
    try {
      const topics = await dashboardService.getTopicsProgress();
      
      res.json({
        success: true,
        data: topics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Topics progress error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch topics progress',
        message: error.message
      });
    }
  }
}

module.exports = DashboardController;