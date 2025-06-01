// src/services/documentsService.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class DocumentsService {
  /**
   * Get list of uploaded documents with metadata
   * @returns {Promise<Array>} Array of documents
   */
  static async getUploadedDocuments() {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/list`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        documents: result.documents || []
      };

    } catch (error) {
      console.error('Documents service error:', error);
      return {
        success: false,
        error: error.message,
        documents: []
      };
    }
  }

  /**
   * Get content of specific document
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} Document content and metadata
   */
  static async getDocumentContent(documentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}/content`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get document content error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get document summary
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} Document summary
   */
  static async getDocumentSummary(documentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}/summary`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get document summary error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Format documents for chat interface
   * @param {Array} documents - Raw documents array
   * @returns {Array} Formatted documents
   */
  static formatDocumentsForChat(documents) {
    const allOption = {
      id: 'all',
      name: 'All Documents',
      count: documents.length,
      description: `All ${documents.length} uploaded documents`,
      type: 'collection'
    };

    const formattedDocs = documents.map(doc => ({
      id: doc.id,
      name: this.getCleanFileName(doc.name),
      originalName: doc.name,
      size: doc.size,
      uploadDate: doc.uploadDate,
      type: doc.type || 'document',
      pageCount: doc.pageCount,
      wordCount: doc.wordCount,
      summary: doc.summary,
      description: this.getDocumentDescription(doc),
      icon: this.getDocumentIcon(doc.name)
    }));

    // Sort by upload date (newest first)
    formattedDocs.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

    return [allOption, ...formattedDocs];
  }

  /**
   * Get clean, readable file name
   * @param {string} fileName - Original file name
   * @returns {string} Clean file name
   */
  static getCleanFileName(fileName) {
    // Remove timestamp prefix and random string
    let cleanName = fileName
      .replace(/^\d+_[a-z0-9]+_/i, '') // Remove timestamp_randomstring_
      .replace(/\.[^/.]+$/, ''); // Remove extension
    
    // If still looks like a processed name, try to extract original
    if (cleanName.includes('_')) {
      const parts = cleanName.split('_');
      cleanName = parts[parts.length - 1] || cleanName;
    }
    
    // Capitalize and clean up
    return cleanName
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim() || 'Document';
  }

  /**
   * Get document description for UI
   * @param {Object} doc - Document object
   * @returns {string} Description
   */
  static getDocumentDescription(doc) {
    const parts = [];
    
    if (doc.pageCount) {
      parts.push(`${doc.pageCount} page${doc.pageCount !== 1 ? 's' : ''}`);
    }
    
    if (doc.wordCount) {
      parts.push(`${doc.wordCount.toLocaleString()} words`);
    }
    
    if (doc.size) {
      parts.push(this.formatFileSize(doc.size));
    }
    
    const uploadDate = new Date(doc.uploadDate);
    const timeAgo = this.getTimeAgo(uploadDate);
    parts.push(`uploaded ${timeAgo}`);
    
    return parts.join(' • ');
  }

  /**
   * Get document icon based on file type
   * @param {string} fileName - File name
   * @returns {string} Icon emoji
   */
  static getDocumentIcon(fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const iconMap = {
      'pdf': '📄',
      'doc': '📝',
      'docx': '📝',
      'txt': '📃',
      'ppt': '📊',
      'pptx': '📊',
      'mp3': '🎵',
      'wav': '🎵',
      'm4a': '🎵'
    };
    
    return iconMap[extension] || '📁';
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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Get time ago string
   * @param {Date} date - Date object
   * @returns {string} Time ago string
   */
  static getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  /**
   * Group documents by type or date
   * @param {Array} documents - Documents array
   * @param {string} groupBy - 'type' or 'date'
   * @returns {Object} Grouped documents
   */
  static groupDocuments(documents, groupBy = 'date') {
    if (groupBy === 'type') {
      return documents.reduce((groups, doc) => {
        const type = doc.type || 'document';
        if (!groups[type]) groups[type] = [];
        groups[type].push(doc);
        return groups;
      }, {});
    }
    
    if (groupBy === 'date') {
      return documents.reduce((groups, doc) => {
        const uploadDate = new Date(doc.uploadDate);
        const today = new Date();
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        let group;
        if (uploadDate.toDateString() === today.toDateString()) {
          group = 'Today';
        } else if (uploadDate.toDateString() === yesterday.toDateString()) {
          group = 'Yesterday';
        } else if (uploadDate > weekAgo) {
          group = 'This Week';
        } else {
          group = 'Older';
        }
        
        if (!groups[group]) groups[group] = [];
        groups[group].push(doc);
        return groups;
      }, {});
    }
    
    return { 'All': documents };
  }

  /**
   * Search documents by name or content
   * @param {Array} documents - Documents to search
   * @param {string} query - Search query
   * @returns {Array} Filtered documents
   */
  static searchDocuments(documents, query) {
    if (!query || query.trim() === '') return documents;
    
    const lowercaseQuery = query.toLowerCase();
    return documents.filter(doc => 
      doc.name.toLowerCase().includes(lowercaseQuery) ||
      doc.originalName.toLowerCase().includes(lowercaseQuery) ||
      doc.summary?.toLowerCase().includes(lowercaseQuery) ||
      doc.description.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Get document-specific context for AI
   * @param {string} documentId - Selected document ID
   * @param {Array} documents - Available documents
   * @returns {string} Context instruction for AI
   */
  static getDocumentContext(documentId, documents) {
    if (documentId === 'all') {
      return 'Answer based on all uploaded documents.';
    }
    
    const doc = documents.find(d => d.id === documentId);
    if (doc) {
      return `Answer based specifically on the document "${doc.name}" (uploaded ${this.getTimeAgo(new Date(doc.uploadDate))}). Focus only on information from this specific document.`;
    }
    
    return '';
  }

  /**
   * Get suggested questions for specific document
   * @param {Object} document - Document object
   * @returns {Array} Suggested questions
   */
  static getDocumentQuestions(document) {
    if (!document || document.id === 'all') {
      return [
        "Summarize all my uploaded documents",
        "What are the main topics across all files?",
        "Compare the content between documents",
        "What's the most recent document about?"
      ];
    }
    
    const fileName = document.name;
    const questions = [
      `Summarize "${fileName}"`,
      `What are the key points in "${fileName}"?`,
      `Explain the main content of "${fileName}"`,
      `Create flashcards from "${fileName}"`
    ];
    
    // Add document-type specific questions
    if (document.type === 'pdf' || fileName.toLowerCase().includes('cv') || fileName.toLowerCase().includes('resume')) {
      questions.push(
        `What experience is mentioned in "${fileName}"?`,
        `What skills are listed in "${fileName}"?`,
        `Tell me about the education in "${fileName}"`
      );
    }
    
    return questions;
  }

  /**
   * Get document statistics
   * @param {Array} documents - Documents array
   * @returns {Object} Statistics
   */
  static getDocumentStats(documents) {
    const stats = {
      total: documents.length,
      totalSize: 0,
      totalWords: 0,
      totalPages: 0,
      byType: {},
      newest: null,
      oldest: null
    };
    
    documents.forEach(doc => {
      stats.totalSize += doc.size || 0;
      stats.totalWords += doc.wordCount || 0;
      stats.totalPages += doc.pageCount || 0;
      
      const type = doc.type || 'document';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      
      const uploadDate = new Date(doc.uploadDate);
      if (!stats.newest || uploadDate > new Date(stats.newest.uploadDate)) {
        stats.newest = doc;
      }
      if (!stats.oldest || uploadDate < new Date(stats.oldest.uploadDate)) {
        stats.oldest = doc;
      }
    });
    
    return stats;
  }
}

export default DocumentsService;