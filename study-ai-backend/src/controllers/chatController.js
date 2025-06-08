const aiService = require('../services/aiService');
const fs = require('fs').promises;
const path = require('path');

class ChatController {
  /**
   * Main chat endpoint
   */
  static async chat(req, res) {
    try {
      const { message, includeContext = true } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          error: 'Message is required',
          message: 'Please provide a message to chat with the AI'
        });
      }

      // Get context from uploaded documents if requested
      let context = '';
      if (includeContext) {
        context = await ChatController.getDocumentContext();
      }

      // Log context info for debugging
      console.log('Chat context info:', {
        requested: includeContext,
        contextLength: context.length,
        hasContent: context.length > 0
      });

      // Get AI response
      const aiResponse = await aiService.chat(message, context);

      // Log for debugging
      console.log('Chat request:', { 
        message: message.substring(0, 50) + '...', 
        provider: aiResponse.provider,
        hasContext: context.length > 0
      });

      res.json({
        message: message,
        response: aiResponse.response,
        provider: aiResponse.provider,
        model: aiResponse.model,
        timestamp: new Date().toISOString(),
        hasContext: context.length > 0,
        contextLength: context.length
      });

    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({
        error: 'Chat failed',
        message: error.message,
        provider: aiService.provider
      });
    }
  }

  /**
   * Get conversation history (placeholder)
   */
  static async getHistory(req, res) {
    try {
      // This would typically fetch from a database
      res.json({
        conversations: [],
        message: 'Chat history - will be implemented with database'
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch chat history',
        message: error.message
      });
    }
  }

  /**
   * AI service health check
   */
  static async healthCheck(req, res) {
    try {
      const health = await aiService.healthCheck();
      
      // Also check document context
      const context = await ChatController.getDocumentContext();
      const availableFiles = await ChatController.getAvailableDocumentFiles();
      
      res.json({
        ...health,
        documentContext: {
          available: context.length > 0,
          length: context.length,
          files: availableFiles
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  /**
   * Get available AI models
   */
  static async getModels(req, res) {
    try {
      const models = await aiService.getAvailableModels();
      res.json({
        provider: aiService.provider,
        models: models
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch models',
        message: error.message
      });
    }
  }

  /**
   * Switch AI provider (for testing)
   */
  static async switchProvider(req, res) {
    try {
      const { provider } = req.body;
      
      if (!['ollama', 'huggingface', 'openai', 'groq', 'deepseek'].includes(provider)) {
        return res.status(400).json({
          error: 'Invalid provider',
          message: 'Provider must be: ollama, huggingface, openai, groq, or deepseek'
        });
      }

      // Update environment variable (this would restart in production)
      process.env.AI_PROVIDER = provider;
      aiService.provider = provider;

      res.json({
        message: `Switched to ${provider}`,
        provider: provider
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to switch provider',
        message: error.message
      });
    }
  }

  /**
   * Get context from uploaded documents - REAL-TIME, NO CACHING
   */
  static async getDocumentContext(limit = 2000) {
    try {
      const extractedTextDir = path.join(process.env.UPLOAD_PATH, 'extracted-text');
      
      // ALWAYS check if directory exists in real-time
      let dirExists = false;
      try {
        await fs.access(extractedTextDir);
        dirExists = true;
      } catch {
        console.log('📁 No extracted text directory found');
        return '';
      }

      if (!dirExists) {
        console.log('📁 Extracted text directory does not exist');
        return '';
      }

      // ALWAYS get fresh file list
      let files = [];
      try {
        files = await fs.readdir(extractedTextDir);
      } catch (error) {
        console.log('📁 Cannot read extracted text directory:', error.message);
        return '';
      }

      if (files.length === 0) {
        console.log('📭 No extracted text files found in directory');
        return '';
      }

      console.log(`📂 Found ${files.length} extracted text files`);

      let combinedContext = '';
      let filesProcessed = 0;

      // Process files (limit to 5 most recent)
      for (const file of files.slice(0, 5)) {
        try {
          const filePath = path.join(extractedTextDir, file);
          
          // Check if file still exists before reading
          let fileExists = false;
          try {
            await fs.access(filePath);
            fileExists = true;
          } catch {
            console.log(`⚠️ File ${file} no longer exists, skipping`);
            continue;
          }

          if (!fileExists) continue;

          const content = await fs.readFile(filePath, 'utf-8');
          
          if (content && content.trim().length > 0) {
            combinedContext += `\n--- From ${file} ---\n${content.substring(0, 500)}\n`;
            filesProcessed++;
            
            // Stop if we have enough context
            if (combinedContext.length > limit) {
              break;
            }
          }
        } catch (error) {
          console.error(`❌ Error reading file ${file}:`, error.message);
          continue;
        }
      }

      const finalContext = combinedContext.substring(0, limit);
      
      console.log(`✅ Document context prepared: ${finalContext.length} chars from ${filesProcessed} files`);
      
      return finalContext;

    } catch (error) {
      console.error('❌ Error getting document context:', error);
      return '';
    }
  }

  /**
   * Get number of available document files
   */
  static async getAvailableDocumentFiles() {
    try {
      const extractedTextDir = path.join(process.env.UPLOAD_PATH, 'extracted-text');
      
      try {
        await fs.access(extractedTextDir);
        const files = await fs.readdir(extractedTextDir);
        return files.length;
      } catch {
        return 0;
      }
    } catch (error) {
      console.error('Error getting available files:', error);
      return 0;
    }
  }

  /**
   * Clear cache and get context status - NEW ENDPOINT
   */
  static async clearCache(req, res) {
    try {
      console.log('🧹 Cache clear requested');
      
      // Since we removed caching, just get fresh context
      const context = await ChatController.getDocumentContext();
      const availableFiles = await ChatController.getAvailableDocumentFiles();
      
      console.log(`🔍 Fresh context check: ${context.length} chars from ${availableFiles} files`);
      
      res.json({
        success: true,
        message: 'Cache cleared (now using real-time file scanning)',
        currentContext: {
          length: context.length,
          hasContent: context.length > 0,
          availableFiles: availableFiles,
          preview: context.substring(0, 200) + (context.length > 200 ? '...' : '')
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear cache',
        message: error.message
      });
    }
  }

  /**
   * Get current context status - NEW ENDPOINT
   */
  static async getContextStatus(req, res) {
    try {
      const context = await ChatController.getDocumentContext(100); // Small sample
      const availableFiles = await ChatController.getAvailableDocumentFiles();
      
      res.json({
        success: true,
        status: {
          hasContext: context.length > 0,
          contextLength: context.length,
          availableFiles: availableFiles,
          preview: context.substring(0, 200) + (context.length > 200 ? '...' : ''),
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Generate study materials (flashcards, summaries)
   */
  static async generateStudyMaterials(req, res) {
    try {
      const { type = 'flashcards', topic, documentId } = req.body;

      // Always get fresh context
      const context = await ChatController.getDocumentContext();
      
      if (!context || context.trim().length === 0) {
        return res.status(400).json({
          error: 'No content available',
          message: 'Please upload some documents first to generate study materials',
          hasContent: false
        });
      }
      
      let prompt;
      switch (type) {
        case 'flashcards':
          prompt = `Based on the following content, create 5-10 flashcards with clear questions and detailed answers. Format each as:

Q: [Question]
A: [Answer]

Content:
${context}`;
          break;
        case 'summary':
          prompt = `Create a concise summary of the following content:\n\n${context}`;
          break;
        case 'quiz':
          prompt = `Create 5 multiple choice questions based on the following content:\n\n${context}`;
          break;
        default:
          prompt = `Analyze the following content and provide key insights:\n\n${context}`;
      }

      const aiResponse = await aiService.chat(prompt);

      res.json({
        type: type,
        content: aiResponse.response,
        provider: aiResponse.provider,
        contextLength: context.length,
        hasContext: context.length > 0,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Study materials generation error:', error);
      res.status(500).json({
        error: 'Failed to generate study materials',
        message: error.message
      });
    }
  }
}

module.exports = ChatController;