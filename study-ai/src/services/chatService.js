// src/services/chatService.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ChatService {
  /**
   * Send message to AI and get response
   * @param {string} message - User message
   * @param {boolean} includeContext - Include uploaded document context
   * @returns {Promise<Object>} AI response
   */
  static async sendMessage(message, includeContext = true) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          includeContext: includeContext
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('Chat service error:', error);
      return {
        success: false,
        error: error.message,
        fallbackResponse: "I'm having trouble connecting to the AI service. Please try again."
      };
    }
  }

  /**
   * Get chat history
   * @returns {Promise<Object>} Chat history
   */
  static async getChatHistory() {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/history`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      return { conversations: [] };
    }
  }

  /**
   * Check AI service health
   * @returns {Promise<Object>} Health status
   */
  static async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Get available AI models
   * @returns {Promise<Object>} Available models
   */
  static async getModels() {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/models`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch models:', error);
      return { models: [] };
    }
  }

  /**
   * Generate study materials
   * @param {string} type - Type of material (flashcards, summary, quiz)
   * @param {string} topic - Optional topic focus
   * @returns {Promise<Object>} Generated materials
   */
  static async generateStudyMaterials(type = 'flashcards', topic = '') {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: type,
          topic: topic
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to generate study materials:', error);
      throw error;
    }
  }

  /**
   * Switch AI provider (for testing)
   * @param {string} provider - Provider name (ollama, huggingface, openai)
   * @returns {Promise<Object>} Switch result
   */
  static async switchProvider(provider) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/provider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: provider
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to switch provider:', error);
      throw error;
    }
  }

  /**
   * Format AI response for display
   * @param {Object} response - Raw AI response
   * @returns {Object} Formatted response
   */
  static formatResponse(response) {
    return {
      id: Date.now(),
      text: response.response || response.fallbackResponse || 'No response received',
      sender: 'ai',
      timestamp: Date.now(),
      provider: response.provider || 'unknown',
      model: response.model,
      hasContext: response.hasContext || false
    };
  }

  /**
   * Format user message
   * @param {string} message - User message
   * @returns {Object} Formatted message
   */
  static formatUserMessage(message) {
    return {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: Date.now()
    };
  }

  /**
   * Validate message before sending
   * @param {string} message - Message to validate
   * @returns {Object} Validation result
   */
  static validateMessage(message) {
    const trimmed = message?.trim();
    
    if (!trimmed) {
      return {
        valid: false,
        error: 'Message cannot be empty'
      };
    }

    if (trimmed.length > 2000) {
      return {
        valid: false,
        error: 'Message is too long (max 2000 characters)'
      };
    }

    return {
      valid: true,
      message: trimmed
    };
  }

  /**
   * Get suggested questions based on uploaded content
   * @returns {Array} Suggested questions
   */
  static getSuggestedQuestions() {
    return [
      "Summarize the key points from my uploaded documents",
      "What are the main topics covered in my materials?",
      "Create flashcards from the uploaded content",
      "Explain the most important concepts",
      "What should I focus on studying?",
      "Generate quiz questions from my notes"
    ];
  }
}

export default ChatService;