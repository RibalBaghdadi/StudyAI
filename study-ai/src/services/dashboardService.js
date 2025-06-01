// src/services/dashboardService.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class DashboardService {
  /**
   * Get comprehensive dashboard data
   * @returns {Promise<Object>} Dashboard statistics
   */
  static async getDashboardData() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data
      };

    } catch (error) {
      console.error('Dashboard service error:', error);
      return {
        success: false,
        error: error.message,
        data: this.getFallbackData()
      };
    }
  }

  /**
   * Get file statistics
   * @returns {Promise<Object>} File statistics
   */
  static async getFileStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/files`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('File stats error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get study statistics
   * @returns {Promise<Object>} Study statistics
   */
  static async getStudyStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/study`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Study stats error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get content analysis
   * @returns {Promise<Object>} Content statistics
   */
  static async getContentStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/content`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Content stats error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get recent activity
   * @returns {Promise<Object>} Recent activity
   */
  static async getRecentActivity() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/activity`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Recent activity error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get topics progress
   * @returns {Promise<Object>} Topics progress
   */
  static async getTopicsProgress() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/topics`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Topics progress error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Format file size for display
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format time duration
   * @param {number} minutes - Duration in minutes
   * @returns {string} Formatted duration
   */
  static formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  /**
   * Calculate study streak
   * @param {Array} studyDays - Array of study session dates
   * @returns {number} Streak in days
   */
  static calculateStreak(studyDays) {
    if (!studyDays || studyDays.length === 0) return 0;
    
    // Sort dates in descending order
    const sortedDays = studyDays.sort((a, b) => new Date(b) - new Date(a));
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const dayStr of sortedDays) {
      const studyDate = new Date(dayStr);
      studyDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((currentDate - studyDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
        currentDate = studyDate;
      } else {
        break;
      }
    }
    
    return streak;
  }

  /**
   * Get study insights based on data
   * @param {Object} dashboardData - Dashboard data
   * @returns {Array} Array of insights
   */
  static getStudyInsights(dashboardData) {
    const insights = [];
    
    if (!dashboardData) return insights;
    
    const { overview, study, content } = dashboardData;
    
    // File upload insights
    if (overview.totalFiles > 0) {
      insights.push({
        type: 'success',
        title: 'Great Progress!',
        message: `You've uploaded ${overview.totalFiles} documents with ${content.totalWords.toLocaleString()} words of content.`
      });
    }
    
    // Reading time insight
    if (content.estimatedReadingTime > 0) {
      insights.push({
        type: 'info',
        title: 'Reading Time',
        message: `Estimated ${content.estimatedReadingTime} minutes to read all your uploaded content.`
      });
    }
    
    // Content complexity insight
    if (content.contentComplexity) {
      const complexityMessages = {
        simple: 'Your content is easy to read - great for quick review!',
        moderate: 'Your content has moderate complexity - perfect for focused study.',
        complex: 'Your content is complex - take your time to understand key concepts.'
      };
      
      insights.push({
        type: 'tip',
        title: 'Content Analysis',
        message: complexityMessages[content.contentComplexity] || 'Content analyzed successfully.'
      });
    }
    
    // Study encouragement
    if (study.totalSessions === 0) {
      insights.push({
        type: 'encourage',
        title: 'Ready to Study?',
        message: 'Start your first study session with the uploaded materials!'
      });
    }
    
    return insights;
  }

  /**
   * Get fallback data when API fails
   * @returns {Object} Fallback dashboard data
   */
  static getFallbackData() {
    return {
      overview: {
        totalFiles: 0,
        totalSize: 0,
        totalWords: 0,
        totalPages: 0,
        lastUpload: null
      },
      files: {
        totalFiles: 0,
        totalSize: 0,
        documents: 0,
        audio: 0,
        processed: 0,
        byType: { pdf: 0, doc: 0, txt: 0, audio: 0 }
      },
      study: {
        totalSessions: 0,
        totalStudyTime: 0,
        weeklyStudyTime: [
          { day: 'Mon', minutes: 0 },
          { day: 'Tue', minutes: 0 },
          { day: 'Wed', minutes: 0 },
          { day: 'Thu', minutes: 0 },
          { day: 'Fri', minutes: 0 },
          { day: 'Sat', minutes: 0 },
          { day: 'Sun', minutes: 0 }
        ]
      },
      content: {
        totalWords: 0,
        totalPages: 0,
        topTopics: [],
        estimatedReadingTime: 0,
        contentComplexity: 'unknown'
      },
      recentActivity: [],
      topicsProgress: [],
      studyTime: {
        totalMinutes: 0,
        thisWeek: 0,
        thisMonth: 0
      }
    };
  }

  /**
   * Check dashboard service health
   * @returns {Promise<Object>} Health status
   */
  static async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/test`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Dashboard health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

export default DashboardService;