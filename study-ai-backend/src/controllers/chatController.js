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

      // Get AI response
      const aiResponse = await aiService.chat(message, context);

      // Log for debugging
      console.log('Chat request:', { message, provider: aiResponse.provider });

      res.json({
        message: message,
        response: aiResponse.response,
        provider: aiResponse.provider,
        model: aiResponse.model,
        timestamp: new Date().toISOString(),
        hasContext: context.length > 0
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
      res.json(health);
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
      
      if (!['ollama', 'huggingface', 'openai'].includes(provider)) {
        return res.status(400).json({
          error: 'Invalid provider',
          message: 'Provider must be: ollama, huggingface, or openai'
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
   * Get context from uploaded documents
   */
  static async getDocumentContext(limit = 2000) {
    try {
      const extractedTextDir = path.join(process.env.UPLOAD_PATH, 'extracted-text');
      
      // Check if directory exists
      try {
        await fs.access(extractedTextDir);
      } catch {
        return ''; // No documents uploaded yet
      }

      const files = await fs.readdir(extractedTextDir);
      let combinedContext = '';

      for (const file of files.slice(0, 5)) { // Limit to 5 most recent files
        try {
          const filePath = path.join(extractedTextDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          
          combinedContext += `\n--- From ${file} ---\n${content.substring(0, 500)}\n`;
          
          // Stop if we have enough context
          if (combinedContext.length > limit) {
            break;
          }
        } catch (error) {
          console.error(`Error reading file ${file}:`, error);
        }
      }

      return combinedContext.substring(0, limit);
    } catch (error) {
      console.error('Error getting document context:', error);
      return '';
    }
  }

  /**
   * Generate study materials (flashcards, summaries)
   */
  static async generateStudyMaterials(req, res) {
    try {
      const { type = 'flashcards', topic } = req.body;

      const context = await ChatController.getDocumentContext();
      
      let prompt;
      switch (type) {
        case 'flashcards':
          prompt = `Based on the following content, create 5 flashcards with questions and answers:\n\n${context}`;
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