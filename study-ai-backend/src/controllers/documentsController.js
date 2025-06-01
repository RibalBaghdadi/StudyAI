const fs = require('fs').promises;
const path = require('path');

class DocumentsController {
  /**
   * Get list of uploaded documents with metadata
   */
  static async getDocumentsList(req, res) {
    try {
      const uploadsPath = process.env.UPLOAD_PATH || './uploads';
      const documentsPath = path.join(uploadsPath, 'documents');
      const audioPath = path.join(uploadsPath, 'audio');
      const extractedTextPath = path.join(uploadsPath, 'extracted-text');
      
      const documents = [];
      
      // Get documents from both folders
      const [docFiles, audioFiles, extractedFiles] = await Promise.all([
        DocumentsController.getFilesFromDirectory(documentsPath),
        DocumentsController.getFilesFromDirectory(audioPath),
        DocumentsController.getFilesFromDirectory(extractedTextPath)
      ]);
      
      // Process document files
      for (const file of docFiles) {
        const docInfo = await DocumentsController.getDocumentInfo(file, 'document', extractedFiles);
        if (docInfo) documents.push(docInfo);
      }
      
      // Process audio files  
      for (const file of audioFiles) {
        const docInfo = await DocumentsController.getDocumentInfo(file, 'audio', extractedFiles);
        if (docInfo) documents.push(docInfo);
      }
      
      // Sort by upload date (newest first)
      documents.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      
      res.json({
        success: true,
        documents: documents,
        total: documents.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Get documents list error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get documents list',
        message: error.message
      });
    }
  }
  
  /**
   * Get specific document content
   */
  static async getDocumentContent(req, res) {
    try {
      const { documentId } = req.params;
      const extractedTextPath = path.join(process.env.UPLOAD_PATH || './uploads', 'extracted-text');
      
      // Find extracted text file for this document
      const extractedFiles = await DocumentsController.getFilesFromDirectory(extractedTextPath);
      const extractedFile = extractedFiles.find(file => file.name.includes(documentId));
      
      if (!extractedFile) {
        return res.status(404).json({
          success: false,
          error: 'Document content not found',
          message: 'Extracted text not available for this document'
        });
      }
      
      const content = await fs.readFile(extractedFile.path, 'utf-8');
      const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
      
      res.json({
        success: true,
        data: {
          documentId: documentId,
          content: content,
          wordCount: wordCount,
          extractedAt: extractedFile.modified,
          preview: content.substring(0, 500) + (content.length > 500 ? '...' : '')
        }
      });
      
    } catch (error) {
      console.error('Get document content error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get document content',
        message: error.message
      });
    }
  }
  
  /**
   * Get document summary
   */
  static async getDocumentSummary(req, res) {
    try {
      const { documentId } = req.params;
      
      // Get document content first
      const contentResult = await DocumentsController.getDocumentContentInternal(documentId);
      
      if (!contentResult.success) {
        return res.status(404).json(contentResult);
      }
      
      const content = contentResult.data.content;
      
      // Generate basic summary
      const summary = DocumentsController.generateBasicSummary(content);
      const keyPoints = DocumentsController.extractKeyPoints(content);
      const topics = DocumentsController.extractTopicsFromContent(content);
      
      res.json({
        success: true,
        data: {
          documentId: documentId,
          summary: summary,
          keyPoints: keyPoints,
          topics: topics,
          wordCount: contentResult.data.wordCount,
          readingTime: Math.ceil(contentResult.data.wordCount / 200) // 200 words per minute
        }
      });
      
    } catch (error) {
      console.error('Get document summary error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get document summary',
        message: error.message
      });
    }
  }
  
  /**
   * Get document-specific context for chat
   */
  static async getDocumentContext(req, res) {
    try {
      const { documentId } = req.params;
      const { limit = 2000 } = req.query;
      
      if (documentId === 'all') {
        // Return context from all documents
        const allContext = await DocumentsController.getAllDocumentsContext(limit);
        return res.json({
          success: true,
          data: {
            documentId: 'all',
            context: allContext,
            contextLength: allContext.length
          }
        });
      }
      
      // Get specific document context
      const contentResult = await DocumentsController.getDocumentContentInternal(documentId);
      
      if (!contentResult.success) {
        return res.status(404).json(contentResult);
      }
      
      const context = contentResult.data.content.substring(0, limit);
      
      res.json({
        success: true,
        data: {
          documentId: documentId,
          context: context,
          contextLength: context.length,
          totalLength: contentResult.data.content.length
        }
      });
      
    } catch (error) {
      console.error('Get document context error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get document context',
        message: error.message
      });
    }
  }

  /**
   * Delete specific document
   */
  static async deleteDocument(req, res) {
    try {
      const { documentId } = req.params;
      const uploadsPath = process.env.UPLOAD_PATH || './uploads';
      
      let deletedFiles = [];
      let documentFound = false;
      
      // Find and delete document file from all possible locations
      const folders = [
        { name: 'documents', path: path.join(uploadsPath, 'documents') },
        { name: 'audio', path: path.join(uploadsPath, 'audio') },
        { name: 'extracted-text', path: path.join(uploadsPath, 'extracted-text') }
      ];
      
      for (const folder of folders) {
        try {
          const files = await fs.readdir(folder.path);
          
          for (const file of files) {
            if (file.includes(documentId)) {
              const filePath = path.join(folder.path, file);
              await fs.unlink(filePath);
              deletedFiles.push({
                folder: folder.name,
                fileName: file,
                path: filePath
              });
              documentFound = true;
              console.log(`Deleted: ${filePath}`);
            }
          }
        } catch (error) {
          // Folder might not exist, continue
          console.log(`Folder ${folder.name} not accessible:`, error.message);
        }
      }
      
      if (!documentFound) {
        return res.status(404).json({
          success: false,
          error: 'Document not found',
          message: `No files found for document ID: ${documentId}`
        });
      }
      
      res.json({
        success: true,
        message: `Document deleted successfully`,
        deletedFiles: deletedFiles,
        documentId: documentId,
        totalDeleted: deletedFiles.length
      });
      
    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete document',
        message: error.message
      });
    }
  }

  /**
   * Delete ALL documents (nuclear option)
   */
  static async deleteAllDocuments(req, res) {
    try {
      const uploadsPath = process.env.UPLOAD_PATH || './uploads';
      let deletedFiles = [];
      let totalDeleted = 0;
      
      const folders = [
        { name: 'documents', path: path.join(uploadsPath, 'documents') },
        { name: 'audio', path: path.join(uploadsPath, 'audio') },
        { name: 'extracted-text', path: path.join(uploadsPath, 'extracted-text') }
      ];
      
      for (const folder of folders) {
        try {
          const files = await fs.readdir(folder.path);
          
          for (const file of files) {
            const filePath = path.join(folder.path, file);
            await fs.unlink(filePath);
            deletedFiles.push({
              folder: folder.name,
              fileName: file,
              path: filePath
            });
            totalDeleted++;
            console.log(`Deleted: ${filePath}`);
          }
        } catch (error) {
          console.log(`Folder ${folder.name} not accessible:`, error.message);
        }
      }
      
      res.json({
        success: true,
        message: `All documents deleted successfully`,
        deletedFiles: deletedFiles,
        totalDeleted: totalDeleted,
        foldersProcessed: folders.map(f => f.name)
      });
      
    } catch (error) {
      console.error('Delete all documents error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete all documents',
        message: error.message
      });
    }
  }

  /**
   * Get delete status/confirmation info
   */
  static async getDeleteInfo(req, res) {
    try {
      const uploadsPath = process.env.UPLOAD_PATH || './uploads';
      const folders = ['documents', 'audio', 'extracted-text'];
      
      let totalFiles = 0;
      let folderStats = {};
      
      for (const folderName of folders) {
        try {
          const folderPath = path.join(uploadsPath, folderName);
          const files = await fs.readdir(folderPath);
          folderStats[folderName] = files.length;
          totalFiles += files.length;
        } catch (error) {
          folderStats[folderName] = 0;
        }
      }
      
      res.json({
        success: true,
        totalFiles: totalFiles,
        folderStats: folderStats,
        warning: totalFiles > 0 ? 'Deletion will permanently remove all files!' : 'No files to delete'
      });
      
    } catch (error) {
      console.error('Get delete info error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get delete information',
        message: error.message
      });
    }
  }
  
  /**
   * Helper: Get files from directory
   */
  static async getFilesFromDirectory(dirPath) {
    try {
      await fs.access(dirPath);
      const files = await fs.readdir(dirPath);
      const fileStats = [];
      
      for (const file of files) {
        try {
          const filePath = path.join(dirPath, file);
          const stats = await fs.stat(filePath);
          
          if (stats.isFile()) {
            fileStats.push({
              name: file,
              path: filePath,
              size: stats.size,
              modified: stats.mtime.getTime(),
              uploadDate: stats.mtime.toISOString()
            });
          }
        } catch (fileError) {
          console.error(`Error getting stats for ${file}:`, fileError);
        }
      }
      
      return fileStats;
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Helper: Get document info with extracted content
   */
  static async getDocumentInfo(file, type, extractedFiles) {
    try {
      // Extract document ID from filename (timestamp part)
      const idMatch = file.name.match(/^(\d+_[a-z0-9]+)/i);
      const documentId = idMatch ? idMatch[1] : file.name.replace(/\.[^/.]+$/, '');
      
      // Find corresponding extracted text file
      const extractedFile = extractedFiles.find(ef => ef.name.includes(documentId));
      
      let wordCount = 0;
      let pageCount = 0;
      let summary = '';
      
      if (extractedFile) {
        try {
          const content = await fs.readFile(extractedFile.path, 'utf-8');
          wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
          pageCount = Math.ceil(wordCount / 300); // Estimate pages
          summary = DocumentsController.generateBasicSummary(content);
        } catch (contentError) {
          console.error('Error reading extracted content:', contentError);
        }
      }
      
      return {
        id: documentId,
        name: file.name,
        originalName: file.name,
        size: file.size,
        type: type,
        uploadDate: file.uploadDate,
        pageCount: pageCount,
        wordCount: wordCount,
        summary: summary,
        hasExtractedContent: !!extractedFile,
        path: file.path
      };
      
    } catch (error) {
      console.error('Error getting document info:', error);
      return null;
    }
  }
  
  /**
   * Helper: Get document content internally
   */
  static async getDocumentContentInternal(documentId) {
    try {
      const extractedTextPath = path.join(process.env.UPLOAD_PATH || './uploads', 'extracted-text');
      const extractedFiles = await DocumentsController.getFilesFromDirectory(extractedTextPath);
      const extractedFile = extractedFiles.find(file => file.name.includes(documentId));
      
      if (!extractedFile) {
        return {
          success: false,
          error: 'Document content not found'
        };
      }
      
      const content = await fs.readFile(extractedFile.path, 'utf-8');
      const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
      
      return {
        success: true,
        data: {
          content: content,
          wordCount: wordCount
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Helper: Get all documents context
   */
  static async getAllDocumentsContext(limit = 2000) {
    try {
      const extractedTextPath = path.join(process.env.UPLOAD_PATH || './uploads', 'extracted-text');
      const files = await fs.readdir(extractedTextPath);
      let combinedContext = '';
      
      for (const file of files.slice(0, 5)) { // Limit to 5 most recent files
        try {
          const filePath = path.join(extractedTextPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          
          combinedContext += `\n--- From ${file} ---\n${content.substring(0, 500)}\n`;
          
          if (combinedContext.length > limit) {
            break;
          }
        } catch (error) {
          console.error(`Error reading file ${file}:`, error);
        }
      }
      
      return combinedContext.substring(0, limit);
    } catch (error) {
      console.error('Error getting all documents context:', error);
      return '';
    }
  }
  
  /**
   * Helper: Generate basic summary
   */
  static generateBasicSummary(text) {
    if (!text || text.length < 100) {
      return 'Document is too short to generate a meaningful summary.';
    }
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const firstSentences = sentences.slice(0, 2).join('. ');
    
    return firstSentences.length > 150 
      ? firstSentences.substring(0, 150) + '...'
      : firstSentences + '.';
  }
  
  /**
   * Helper: Extract key points
   */
  static extractKeyPoints(text) {
    // Simple key point extraction
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 5).map(s => s.trim());
  }
  
  /**
   * Helper: Extract topics from content
   */
  static extractTopicsFromContent(text) {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4);
    
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    return Object.entries(wordCount)
      .filter(([word, count]) => count >= 2)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }
}

module.exports = DocumentsController;