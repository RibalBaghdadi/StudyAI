const fs = require('fs').promises;
const path = require('path');

class DashboardService {
  constructor() {
    this.uploadsPath = process.env.UPLOAD_PATH || './uploads';
    this.extractedTextPath = path.join(this.uploadsPath, 'extracted-text');
  }

  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats() {
    try {
      const [fileStats, studyStats, contentStats] = await Promise.all([
        this.getFileStatistics(),
        this.getStudyStatistics(),
        this.getContentStatistics()
      ]);

      return {
        overview: {
          totalFiles: fileStats.totalFiles,
          totalSize: fileStats.totalSize,
          totalWords: contentStats.totalWords,
          totalPages: contentStats.totalPages,
          lastUpload: fileStats.lastUpload
        },
        files: fileStats,
        study: studyStats,
        content: contentStats,
        recentActivity: await this.getRecentActivity(),
        topicsProgress: await this.getTopicsProgress(),
        studyTime: await this.getStudyTimeStats()
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get file upload statistics
   */
  async getFileStatistics() {
    try {
      const documentsPath = path.join(this.uploadsPath, 'documents');
      const audioPath = path.join(this.uploadsPath, 'audio');
      
      const [documents, audio, extractedFiles] = await Promise.all([
        this.getDirectoryStats(documentsPath),
        this.getDirectoryStats(audioPath),
        this.getDirectoryStats(this.extractedTextPath)
      ]);

      const totalFiles = documents.count + audio.count;
      const totalSize = documents.size + audio.size;
      
      // Get last upload time
      const allFiles = [...documents.files, ...audio.files];
      const lastUpload = allFiles.length > 0 
        ? Math.max(...allFiles.map(f => f.modified))
        : null;

      return {
        totalFiles,
        totalSize,
        lastUpload: lastUpload ? new Date(lastUpload).toISOString() : null,
        documents: documents.count,
        audio: audio.count,
        processed: extractedFiles.count,
        byType: {
          pdf: documents.files.filter(f => f.name.toLowerCase().includes('.pdf')).length,
          doc: documents.files.filter(f => f.name.toLowerCase().includes('.doc')).length,
          txt: documents.files.filter(f => f.name.toLowerCase().includes('.txt')).length,
          audio: audio.count
        }
      };
    } catch (error) {
      console.error('Error getting file statistics:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        lastUpload: null,
        documents: 0,
        audio: 0,
        processed: 0,
        byType: { pdf: 0, doc: 0, txt: 0, audio: 0 }
      };
    }
  }

  /**
   * Get study session statistics
   */
  async getStudyStatistics() {
    // TODO: This will be implemented when we add session tracking
    // For now, return calculated stats based on file activity
    
    const currentDate = new Date();
    const weekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return {
      totalSessions: 0, // Will track actual sessions later
      totalStudyTime: 0, // In minutes
      averageSessionTime: 0,
      weeklyStudyTime: [
        { day: 'Mon', minutes: 0 },
        { day: 'Tue', minutes: 0 },
        { day: 'Wed', minutes: 0 },
        { day: 'Thu', minutes: 0 },
        { day: 'Fri', minutes: 0 },
        { day: 'Sat', minutes: 0 },
        { day: 'Sun', minutes: 0 }
      ],
      streakDays: 0,
      lastStudyDate: null
    };
  }

  /**
   * Get content analysis statistics
   */
  async getContentStatistics() {
    try {
      let totalWords = 0;
      let totalPages = 0;
      let totalCharacters = 0;
      const topics = {};

      // Read all extracted text files
      const files = await this.getExtractedTextFiles();
      
      for (const file of files) {
        try {
          const content = await fs.readFile(file.path, 'utf-8');
          const words = content.split(/\s+/).filter(word => word.length > 0).length;
          const characters = content.length;
          
          totalWords += words;
          totalCharacters += characters;
          totalPages += Math.ceil(words / 300); // Estimate pages (300 words per page)
          
          // Extract potential topics (simple keyword extraction)
          const contentTopics = this.extractTopics(content);
          contentTopics.forEach(topic => {
            topics[topic] = (topics[topic] || 0) + 1;
          });
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
        }
      }

      const topTopics = Object.entries(topics)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([topic, count]) => ({ topic, count }));

      return {
        totalWords,
        totalPages,
        totalCharacters,
        averageWordsPerDocument: files.length > 0 ? Math.round(totalWords / files.length) : 0,
        topTopics,
        estimatedReadingTime: Math.round(totalWords / 200), // 200 words per minute
        contentComplexity: this.calculateComplexity(totalWords, totalCharacters)
      };
    } catch (error) {
      console.error('Error getting content statistics:', error);
      return {
        totalWords: 0,
        totalPages: 0,
        totalCharacters: 0,
        averageWordsPerDocument: 0,
        topTopics: [],
        estimatedReadingTime: 0,
        contentComplexity: 'unknown'
      };
    }
  }

  /**
   * Get recent activity feed
   */
  async getRecentActivity() {
    try {
      const activities = [];
      
      // Get recent file uploads
      const [documents, audio] = await Promise.all([
        this.getDirectoryStats(path.join(this.uploadsPath, 'documents')),
        this.getDirectoryStats(path.join(this.uploadsPath, 'audio'))
      ]);

      const allFiles = [...documents.files, ...audio.files]
        .sort((a, b) => b.modified - a.modified)
        .slice(0, 10);

      allFiles.forEach(file => {
        const timeAgo = this.getTimeAgo(file.modified);
        activities.push({
          id: `upload_${file.name}`,
          type: 'upload',
          title: `Uploaded "${file.name}"`,
          time: timeAgo,
          icon: file.name.includes('.pdf') ? '📄' : 
                file.name.includes('.doc') ? '📝' : 
                file.name.includes('.mp3') || file.name.includes('.wav') ? '🎵' : '📁',
          timestamp: new Date(file.modified).toISOString()
        });
      });

      // TODO: Add chat activities, study sessions, etc.

      return activities.slice(0, 5);
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  /**
   * Get topics progress (based on content analysis)
   */
  async getTopicsProgress() {
    try {
      const contentStats = await this.getContentStatistics();
      
      return contentStats.topTopics.map(({ topic, count }) => ({
        name: topic,
        progress: Math.min(count * 20, 100), // Simple progress calculation
        cards: count * 5, // Estimate flashcards
        mastered: Math.floor(count * 3), // Estimate mastered
        totalFiles: count
      }));
    } catch (error) {
      console.error('Error getting topics progress:', error);
      return [];
    }
  }

  /**
   * Get study time statistics
   */
  async getStudyTimeStats() {
    // TODO: Implement actual study time tracking
    // For now, return estimated based on content
    
    const contentStats = await this.getContentStatistics();
    const estimatedStudyTime = contentStats.estimatedReadingTime;
    
    return {
      totalMinutes: estimatedStudyTime,
      thisWeek: Math.floor(estimatedStudyTime * 0.3),
      thisMonth: Math.floor(estimatedStudyTime * 0.7),
      averageDaily: Math.floor(estimatedStudyTime / 7),
      goalProgress: 65 // Placeholder goal progress
    };
  }

  /**
   * Helper: Get directory statistics
   */
  async getDirectoryStats(dirPath) {
    try {
      await fs.access(dirPath);
      const files = await fs.readdir(dirPath);
      const fileStats = [];
      let totalSize = 0;

      for (const file of files) {
        try {
          const filePath = path.join(dirPath, file);
          const stats = await fs.stat(filePath);
          
          if (stats.isFile()) {
            fileStats.push({
              name: file,
              size: stats.size,
              modified: stats.mtime.getTime(),
              path: filePath
            });
            totalSize += stats.size;
          }
        } catch (fileError) {
          console.error(`Error getting stats for ${file}:`, fileError);
        }
      }

      return {
        count: fileStats.length,
        size: totalSize,
        files: fileStats
      };
    } catch (error) {
      return { count: 0, size: 0, files: [] };
    }
  }

  /**
   * Helper: Get extracted text files
   */
  async getExtractedTextFiles() {
    try {
      const files = await fs.readdir(this.extractedTextPath);
      return files
        .filter(file => file.endsWith('.txt'))
        .map(file => ({
          name: file,
          path: path.join(this.extractedTextPath, file)
        }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Helper: Extract topics from content (simple keyword extraction)
   */
  extractTopics(content) {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4);
    
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    return Object.entries(wordCount)
      .filter(([word, count]) => count >= 3) // Must appear at least 3 times
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Helper: Calculate content complexity
   */
  calculateComplexity(totalWords, totalCharacters) {
    if (totalWords === 0) return 'unknown';
    
    const avgWordLength = totalCharacters / totalWords;
    
    if (avgWordLength < 4) return 'simple';
    if (avgWordLength < 6) return 'moderate';
    return 'complex';
  }

  /**
   * Helper: Format time ago
   */
  getTimeAgo(timestamp) {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = new DashboardService();