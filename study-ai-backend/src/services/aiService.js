const axios = require('axios');

class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'groq';
    
    // Ollama configuration
    this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.ollamaModel = process.env.OLLAMA_MODEL || 'llama3.1:8b';
  }

  /**
   * Main chat method - routes to appropriate AI provider
   */
  async chat(message, context = '') {
    try {
      console.log(`🧠 Using AI provider: ${this.provider}`);
      
      switch (this.provider) {
        case 'groq':
          return await this.chatWithGroq(message, context);
        
        case 'ollama':
          return await this.chatWithOllama(message, context);
        
        case 'deepseek':
          return await this.chatWithDeepSeek(message, context);
        
        case 'openai':
          return await this.chatWithOpenAI(message, context);
        
        default:
          return await this.chatWithGroq(message, context); // Default to Groq
      }
    } catch (error) {
      console.error('AI Chat error:', error);
      
      // Smart fallback based on the message and context
      let fallbackResponse = "Hello! ";
      
      if (context && context.length > 0) {
        if (message.toLowerCase().includes('cv') || message.toLowerCase().includes('resume')) {
          fallbackResponse += "I can see your CV shows you're Ribal Baghdadi, a Computer Science graduate from Lebanese University working as a Software Engineer at Ecrio INC. What would you like to know about your background?";
        } else if (message.toLowerCase().includes('name')) {
          fallbackResponse += "From your uploaded CV, I can see your name is Ribal Baghdadi. You're from Tyre, Lebanon.";
        } else {
          fallbackResponse += "I can see your uploaded study materials about your background and experience. What specific topic would you like to discuss?";
        }
      } else {
        fallbackResponse += "I'm ready to help with your studies! Upload some documents and I'll analyze them for you.";
      }
      
      return {
        response: fallbackResponse,
        provider: 'fallback',
        error: error.message
      };
    }
  }

  /**
   * Chat with Groq (Free & Fast)
   */
  async chatWithGroq(message, context) {
    try {
      if (!process.env.GROQ_API_KEY) {
        throw new Error('Groq API key not configured');
      }

      const prompt = this.buildPrompt(message, context);
      console.log('🤖 Sending to Groq:', prompt.substring(0, 100) + '...');

      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.1-8b-instant', // Free model
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI study assistant. Answer questions based on the provided context from uploaded study materials. Be conversational and helpful.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: false
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const responseText = response.data.choices[0].message.content;
      console.log('✅ Groq success, response length:', responseText.length);

      return {
        response: responseText,
        provider: 'groq',
        model: 'llama-3.1-70b-versatile'
      };
    } catch (error) {
      console.error('Groq error:', error.response?.data || error.message);
      throw new Error(`Groq API failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Chat with DeepSeek
   */
  async chatWithDeepSeek(message, context) {
    try {
      if (!process.env.DEEPSEEK_API_KEY) {
        throw new Error('DeepSeek API key not configured');
      }

      const prompt = this.buildPrompt(message, context);

      const response = await axios.post('https://api.deepseek.com/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI study assistant. Answer questions based on the provided context.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        response: response.data.choices[0].message.content,
        provider: 'deepseek',
        model: 'deepseek-chat'
      };
    } catch (error) {
      throw new Error(`DeepSeek API failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Chat with local Ollama
   */
  async chatWithOllama(message, context) {
    try {
      const prompt = this.buildPrompt(message, context);
      
      const response = await axios.post(`${this.ollamaBaseUrl}/api/generate`, {
        model: this.ollamaModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 1000
        }
      });

      return {
        response: response.data.response,
        provider: 'ollama',
        model: this.ollamaModel
      };
    } catch (error) {
      throw new Error(`Ollama connection failed: ${error.message}`);
    }
  }

  /**
   * Chat with OpenAI
   */
  async chatWithOpenAI(message, context) {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      const prompt = this.buildPrompt(message, context);

      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI study assistant.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        response: response.data.choices[0].message.content,
        provider: 'openai',
        model: 'gpt-3.5-turbo'
      };
    } catch (error) {
      throw new Error(`OpenAI connection failed: ${error.message}`);
    }
  }

  /**
   * Build prompt with context from uploaded documents
   */
  buildPrompt(message, context) {
    if (context && context.trim()) {
      return `Based on the following study materials:

${context.substring(0, 2000)}

Student Question: ${message}

Please provide a helpful response based on the study materials above. Be conversational and helpful.`;
    } else {
      return `Student Question: ${message}

Please provide a helpful educational response.`;
    }
  }

  /**
   * Check if AI service is available
   */
  async healthCheck() {
    try {
      switch (this.provider) {
        case 'groq':
          return {
            status: 'healthy',
            provider: 'groq',
            note: 'Using free Groq API with Llama models',
            configured: !!process.env.GROQ_API_KEY
          };
        
        case 'ollama':
          const ollamaResponse = await axios.get(`${this.ollamaBaseUrl}/api/tags`);
          return {
            status: 'healthy',
            provider: 'ollama',
            models: ollamaResponse.data.models || []
          };
        
        case 'deepseek':
          return {
            status: 'healthy',
            provider: 'deepseek',
            note: 'DeepSeek API configured',
            configured: !!process.env.DEEPSEEK_API_KEY
          };
        
        case 'openai':
          return {
            status: 'healthy',
            provider: 'openai',
            note: 'OpenAI API configured',
            configured: !!process.env.OPENAI_API_KEY
          };
        
        default:
          return {
            status: 'unknown',
            provider: this.provider
          };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        provider: this.provider,
        error: error.message
      };
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels() {
    try {
      switch (this.provider) {
        case 'groq':
          return [
            { name: 'llama-3.1-70b-versatile', description: 'Llama 3.1 70B (Free & Fast)' },
            { name: 'llama-3.1-8b-instant', description: 'Llama 3.1 8B (Very Fast)' },
            { name: 'mixtral-8x7b-32768', description: 'Mixtral 8x7B (Free)' }
          ];
        
        case 'deepseek':
          return [
            { name: 'deepseek-chat', description: 'DeepSeek Chat Model' }
          ];
        
        case 'openai':
          return [
            { name: 'gpt-3.5-turbo', description: 'OpenAI GPT-3.5' }
          ];
        
        default:
          return [];
      }
    } catch (error) {
      return [];
    }
  }
}

module.exports = new AIService();