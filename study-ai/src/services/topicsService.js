// src/services/topicsService.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class TopicsService {
  /**
   * Get topics extracted from uploaded documents
   * @returns {Promise<Array>} Array of topics with metadata
   */
  static async getDocumentTopics() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/topics`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        return this.formatTopicsForChat(result.data);
      }
      
      return this.getFallbackTopics();
    } catch (error) {
      console.error('Topics service error:', error);
      return this.getFallbackTopics();
    }
  }

  /**
   * Format topics for chat interface
   * @param {Array} rawTopics - Raw topics from API
   * @returns {Array} Formatted topics
   */
  static formatTopicsForChat(rawTopics) {
    const formattedTopics = [
      {
        id: 'all',
        name: 'All Content',
        count: rawTopics.reduce((sum, topic) => sum + topic.totalFiles, 0),
        description: 'All uploaded documents'
      }
    ];

    // Convert API topics to chat format
    rawTopics.forEach((topic, index) => {
      formattedTopics.push({
        id: topic.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        name: this.capitalizeWord(topic.name),
        count: topic.totalFiles,
        description: `Found in ${topic.totalFiles} document${topic.totalFiles !== 1 ? 's' : ''}`,
        progress: topic.progress,
        cards: topic.cards,
        mastered: topic.mastered
      });
    });

    return formattedTopics;
  }

  /**
   * Get content-aware suggested questions
   * @param {Array} topics - Available topics
   * @returns {Array} Suggested questions
   */
  static getSuggestedQuestions(topics = []) {
    const baseQuestions = [
      "Summarize the key points from my uploaded documents",
      "What are the main topics covered in my materials?"
    ];

    // Add topic-specific questions based on detected content
    const topicQuestions = [];
    
    topics.slice(1, 6).forEach(topic => { // Skip 'all' and take first 5 real topics
      topicQuestions.push(`Tell me more about ${topic.name.toLowerCase()}`);
      topicQuestions.push(`Create flashcards about ${topic.name.toLowerCase()}`);
    });

    const contentAwareQuestions = [
      "Explain the technical concepts in my CV",
      "What programming skills are mentioned?",
      "Summarize my work experience",
      "What projects have I worked on?",
      "Generate quiz questions from my resume"
    ];

    return [
      ...baseQuestions,
      ...topicQuestions.slice(0, 3), // Limit topic questions
      ...contentAwareQuestions
    ].slice(0, 8); // Limit total questions
  }

  /**
   * Get topic-specific chat context
   * @param {string} topicId - Selected topic ID
   * @param {Array} topics - Available topics
   * @returns {string} Context string for AI
   */
  static getTopicContext(topicId, topics = []) {
    if (topicId === 'all') {
      return 'Focus on all content from the uploaded documents.';
    }

    const topic = topics.find(t => t.id === topicId);
    if (topic) {
      return `Focus specifically on information related to "${topic.name}" from the uploaded documents.`;
    }

    return '';
  }

  /**
   * Detect content type from topics
   * @param {Array} topics - Topics array
   * @returns {string} Content type
   */
  static detectContentType(topics) {
    const topicNames = topics.map(t => t.name.toLowerCase()).join(' ');
    
    if (topicNames.includes('programming') || topicNames.includes('software') || 
        topicNames.includes('code') || topicNames.includes('development') ||
        topicNames.includes('javascript') || topicNames.includes('react') ||
        topicNames.includes('mongodb') || topicNames.includes('express')) {
      return 'programming';
    }
    
    if (topicNames.includes('biology') || topicNames.includes('chemistry') || 
        topicNames.includes('physics') || topicNames.includes('science')) {
      return 'science';
    }
    
    if (topicNames.includes('history') || topicNames.includes('literature') || 
        topicNames.includes('language') || topicNames.includes('english')) {
      return 'humanities';
    }
    
    if (topicNames.includes('math') || topicNames.includes('calculus') || 
        topicNames.includes('algebra') || topicNames.includes('statistics')) {
      return 'mathematics';
    }
    
    if (topicNames.includes('business') || topicNames.includes('management') || 
        topicNames.includes('marketing') || topicNames.includes('finance')) {
      return 'business';
    }
    
    return 'general';
  }

  /**
   * Get content type specific suggestions
   * @param {string} contentType - Detected content type
   * @returns {Array} Type-specific suggestions
   */
  static getContentTypeQuestions(contentType) {
    const questionSets = {
      programming: [
        "Explain the technical stack used in my projects",
        "What programming languages do I know?",
        "Describe my software development experience",
        "What frameworks and tools have I used?",
        "Generate coding interview questions from my experience"
      ],
      science: [
        "Explain the key scientific concepts",
        "Create a study guide for the main topics",
        "What are the important formulas to remember?",
        "Generate lab-style questions",
        "Summarize the experimental methods"
      ],
      humanities: [
        "Analyze the main themes and ideas",
        "Create discussion questions about the content",
        "Explain the historical context",
        "What are the key arguments presented?",
        "Generate essay prompts from the material"
      ],
      mathematics: [
        "Explain the mathematical concepts step by step",
        "Create practice problems",
        "What formulas should I memorize?",
        "Generate word problems",
        "Explain the problem-solving methods"
      ],
      business: [
        "Summarize the business concepts",
        "What are the key strategies discussed?",
        "Create case study questions",
        "Explain the market analysis",
        "Generate business scenario questions"
      ],
      general: [
        "Summarize the main points",
        "Create study questions",
        "What are the key takeaways?",
        "Generate review questions",
        "Explain the important concepts"
      ]
    };

    return questionSets[contentType] || questionSets.general;
  }

  /**
   * Get fallback topics when API fails
   * @returns {Array} Fallback topics
   */
  static getFallbackTopics() {
    return [
      {
        id: 'all',
        name: 'All Content',
        count: 0,
        description: 'All uploaded documents'
      },
      {
        id: 'general',
        name: 'General Topics',
        count: 0,
        description: 'Upload documents to see topics'
      }
    ];
  }

  /**
   * Helper: Capitalize first letter of word
   * @param {string} word - Word to capitalize
   * @returns {string} Capitalized word
   */
  static capitalizeWord(word) {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  /**
   * Search topics by query
   * @param {Array} topics - Topics to search
   * @param {string} query - Search query
   * @returns {Array} Filtered topics
   */
  static searchTopics(topics, query) {
    if (!query || query.trim() === '') return topics;
    
    const lowercaseQuery = query.toLowerCase();
    return topics.filter(topic => 
      topic.name.toLowerCase().includes(lowercaseQuery) ||
      topic.description.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Get topic statistics
   * @param {Array} topics - Topics array
   * @returns {Object} Topic statistics
   */
  static getTopicStats(topics) {
    if (!topics || topics.length <= 1) { // Subtract 1 for 'all' topic
      return {
        totalTopics: 0,
        totalDocuments: 0,
        averageTopicsPerDocument: 0
      };
    }

    const realTopics = topics.slice(1); // Skip 'all' topic
    const totalDocuments = Math.max(...realTopics.map(t => t.count));
    
    return {
      totalTopics: realTopics.length,
      totalDocuments: totalDocuments,
      averageTopicsPerDocument: realTopics.length > 0 ? Math.round(realTopics.length / totalDocuments) : 0
    };
  }
}

export default TopicsService;