import React, { useState, useRef, useEffect } from 'react';
import MessageBubble from '../../components/MessageBubble';
import ChatInput from '../../components/ChatInput';
import SectionTitle from '../../components/SectionTitle';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import ChatService from '../../services/chatService';
import DocumentsService from '../../services/documentsService';

const ChatPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI study assistant. I've analyzed your uploaded materials and I'm ready to help you learn. What would you like to know?",
      sender: 'ai',
      timestamp: Date.now() - 300000
    }
  ]);
  
  const [isTyping, setIsTyping] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState('all');
  const [aiStatus, setAiStatus] = useState('checking');
  const [aiInfo, setAiInfo] = useState({});
  const [error, setError] = useState(null);
  
  // Documents state
  const [availableDocuments, setAvailableDocuments] = useState([]);
  const [quickQuestions, setQuickQuestions] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState('date'); // 'date' or 'type'
  
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    checkAIHealth();
    loadDocuments();
  }, []);

  // Update quick questions when document selection changes
  useEffect(() => {
    if (availableDocuments.length > 0) {
      const selectedDoc = availableDocuments.find(doc => doc.id === selectedDocument);
      const questions = DocumentsService.getDocumentQuestions(selectedDoc);
      setQuickQuestions(questions);
      
      // Update welcome message based on selection
      if (selectedDoc && selectedDoc.id !== 'all') {
        const contextualWelcome = `I'm ready to help you with "${selectedDoc.name}". This document has ${selectedDoc.wordCount?.toLocaleString()} words and ${selectedDoc.pageCount} pages. What would you like to know about it?`;
        setMessages(prev => prev.map(msg => 
          msg.id === 1 ? { ...msg, text: contextualWelcome } : msg
        ));
      }
    }
  }, [selectedDocument, availableDocuments]);
  
  const checkAIHealth = async () => {
    try {
      const health = await ChatService.checkHealth();
      setAiStatus(health.status === 'healthy' ? 'connected' : 'disconnected');
      setAiInfo(health);
    } catch (error) {
      setAiStatus('disconnected');
      setAiInfo({ error: error.message });
    }
  };

  const loadDocuments = async () => {
    setDocumentsLoading(true);
    try {
      const result = await DocumentsService.getUploadedDocuments();
      
      if (result.success && result.documents.length > 0) {
        const formattedDocs = DocumentsService.formatDocumentsForChat(result.documents);
        setAvailableDocuments(formattedDocs);
        
        // Update initial welcome message
        const stats = DocumentsService.getDocumentStats(result.documents);
        const contextualWelcome = `Hello! I'm your AI study assistant. I've analyzed ${stats.total} uploaded documents with ${stats.totalWords.toLocaleString()} total words. I can help you with individual documents or all content together. What would you like to explore?`;
        
        setMessages(prev => prev.map(msg => 
          msg.id === 1 ? { ...msg, text: contextualWelcome } : msg
        ));
      } else {
        setAvailableDocuments([{
          id: 'all',
          name: 'No Documents',
          count: 0,
          description: 'Upload some documents to get started'
        }]);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
      setAvailableDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleSendMessage = async (messageText) => {
    setError(null);
    
    // Validate message
    const validation = ChatService.validateMessage(messageText);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Add document context to the message
    const documentContext = DocumentsService.getDocumentContext(selectedDocument, availableDocuments);
    const contextualMessage = documentContext ? `${documentContext} ${validation.message}` : validation.message;

    // Add user message
    const userMessage = ChatService.formatUserMessage(validation.message);
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    try {
      // Send to AI with document-specific context
      const response = await ChatService.sendMessage(contextualMessage, true);
      
      let aiMessage;
      if (response.success) {
        aiMessage = ChatService.formatResponse(response.data);
        // Add document context info to AI message
        if (selectedDocument !== 'all') {
          const doc = availableDocuments.find(d => d.id === selectedDocument);
          if (doc) {
            aiMessage.documentContext = doc.name;
          }
        }
      } else {
        aiMessage = {
          id: Date.now() + 1,
          text: response.fallbackResponse || "I'm having trouble right now. Please try again.",
          sender: 'ai',
          timestamp: Date.now(),
          error: true
        };
        setError(response.error);
      }
      
      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm experiencing technical difficulties. Please try again in a moment.",
        sender: 'ai',
        timestamp: Date.now(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
      setError(error.message);
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleQuickQuestion = (question) => {
    handleSendMessage(question);
  };
  
  const clearChat = () => {
    const selectedDoc = availableDocuments.find(doc => doc.id === selectedDocument);
    const contextualWelcome = selectedDoc && selectedDoc.id !== 'all'
      ? `Chat cleared! I'm ready to help you with "${selectedDoc.name}". What would you like to know?`
      : "Chat cleared! I'm ready to help you with your studies. What would you like to learn about?";
      
    setMessages([
      {
        id: 1,
        text: contextualWelcome,
        sender: 'ai',
        timestamp: Date.now()
      }
    ]);
    setError(null);
  };

  const generateStudyMaterials = async (type) => {
    setIsTyping(true);
    try {
      const materials = await ChatService.generateStudyMaterials(type);
      const aiMessage = {
        id: Date.now(),
        text: materials.content,
        sender: 'ai',
        timestamp: Date.now(),
        type: type
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      setError(`Failed to generate ${type}: ${error.message}`);
    } finally {
      setIsTyping(false);
    }
  };

  // AI Status Component
  const AIStatus = () => {
    if (aiStatus === 'checking') {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Loader size="sm" className="mr-3" />
            <span className="text-yellow-800">Connecting to AI service...</span>
          </div>
        </div>
      );
    }

    if (aiStatus === 'disconnected') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-red-600 mr-3">⚠️</span>
              <div>
                <div className="text-red-800 font-medium">AI Service Disconnected</div>
                <div className="text-red-600 text-sm">
                  {aiInfo.error || 'Make sure your backend server is running'}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={checkAIHealth}>
              🔄 Retry
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-green-600 mr-3">🧠</span>
            <div>
              <span className="text-green-800 font-medium">AI Connected</span>
              <div className="text-green-600 text-sm">
                Using {aiInfo.provider} • Ready to analyze documents
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getCurrentDocumentName = () => {
    if (selectedDocument === 'all') return 'all documents';
    const doc = availableDocuments.find(d => d.id === selectedDocument);
    return doc ? `"${doc.name}"` : 'selected document';
  };

  // Filter and group documents
  const filteredDocuments = DocumentsService.searchDocuments(availableDocuments, searchQuery);
  const groupedDocuments = DocumentsService.groupDocuments(filteredDocuments.slice(1), groupBy); // Skip 'all' option for grouping
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <SectionTitle 
          title="AI Study Chat"
          subtitle="Ask questions about specific documents or all your content"
          icon="💬"
        />
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearChat}>
            🗑️ Clear Chat
          </Button>
          <Button variant="outline" size="sm" onClick={loadDocuments}>
            🔄 Refresh Documents
          </Button>
        </div>
      </div>

      {/* AI Status */}
      <AIStatus />
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <span className="text-red-500 mr-3 mt-1">❌</span>
              <div>
                <div className="text-red-800 font-medium mb-1">Error</div>
                <div className="text-red-700 text-sm">{error}</div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setError(null)}
            >
              ✕
            </Button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Document Selector */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Select Document</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => setGroupBy('date')}
                  className={`px-2 py-1 text-xs rounded ${groupBy === 'date' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}
                >
                  📅
                </button>
                <button
                  onClick={() => setGroupBy('type')}
                  className={`px-2 py-1 text-xs rounded ${groupBy === 'type' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}
                >
                  📁
                </button>
              </div>
            </div>
            
            {/* Search */}
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {documentsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader size="sm" text="Loading documents..." />
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                {/* All Documents Option */}
                <button
                  onClick={() => setSelectedDocument('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedDocument === 'all'
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="mr-2">📚</span>
                      <span>All Documents</span>
                    </div>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                      {availableDocuments.length - 1}
                    </span>
                  </div>
                </button>
                
                {/* Grouped Documents */}
                {Object.entries(groupedDocuments).map(([groupName, docs]) => (
                  <div key={groupName}>
                    <div className="text-xs font-medium text-gray-500 px-3 py-1 uppercase tracking-wide">
                      {groupName}
                    </div>
                    {docs.map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDocument(doc.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedDocument === doc.id
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-start">
                          <span className="mr-2 mt-0.5">{doc.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{doc.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {doc.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Quick Questions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Questions</h3>
            <div className="space-y-2">
              {quickQuestions.slice(0, 4).map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={aiStatus !== 'connected'}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Study Tools */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Study Tools</h3>
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => generateStudyMaterials('flashcards')}
                disabled={aiStatus !== 'connected' || isTyping}
              >
                🃏 Generate Flashcards
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => generateStudyMaterials('summary')}
                disabled={aiStatus !== 'connected' || isTyping}
              >
                📋 Create Summary
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => generateStudyMaterials('quiz')}
                disabled={aiStatus !== 'connected' || isTyping}
              >
                ❓ Generate Quiz
              </Button>
            </div>
          </div>
          
          {/* Chat Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Session Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Messages:</span>
                <span className="font-medium">{messages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">AI Provider:</span>
                <span className="font-medium capitalize">{aiInfo.provider || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Documents:</span>
                <span className="font-medium">{availableDocuments.length - 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${aiStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                  {aiStatus === 'connected' ? '🟢 Active' : '🔴 Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Chat */}
        <div className="lg:col-span-3">
          <div className="chat-container bg-white rounded-xl shadow-sm border border-gray-100 h-[700px]">
            {/* Chat Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg">
                  🧠
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI Study Assistant</h3>
                  <p className="text-sm text-gray-600">
                    {isTyping ? 'Analyzing...' : `Focused on ${getCurrentDocumentName()}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${aiStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className="text-sm text-gray-600">
                  {aiStatus === 'connected' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            
            {/* Messages */}
            <div className="chat-messages flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {messages.map(message => (
                <MessageBubble
                  key={message.id}
                  message={message.text}
                  sender={message.sender}
                  timestamp={message.timestamp}
                />
              ))}
              
              {isTyping && (
                <MessageBubble
                  message=""
                  sender="ai"
                  isTyping={true}
                />
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Chat Input */}
            <ChatInput 
              onSendMessage={handleSendMessage}
              disabled={isTyping || aiStatus !== 'connected'}
              placeholder={`Ask about ${getCurrentDocumentName()}...`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;