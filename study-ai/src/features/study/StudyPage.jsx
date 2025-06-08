import React, { useState, useEffect } from 'react';
import Flashcard from '../../components/FlashCard';
import SectionTitle from '../../components/SectionTitle';
import Button from '../../components/Button';

const StudyPage = () => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [studyMode, setStudyMode] = useState('flashcards');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    total: 0
  });
  
  // Real data states
  const [flashcards, setFlashcards] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatingCards, setGeneratingCards] = useState(false);
  const [topics, setTopics] = useState([]);

  // Load documents and existing flashcards on component mount
  useEffect(() => {
    loadDocuments();
    loadExistingFlashcards();
  }, []);

  // Update topics when flashcards change
  useEffect(() => {
    updateTopics();
  }, [flashcards]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/documents/list');
      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.documents);
      } else {
        setError('Failed to load documents');
      }
    } catch (err) {
      setError('Error loading documents: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingFlashcards = () => {
    // Load flashcards from localStorage if any exist
    const saved = localStorage.getItem('studyai_flashcards');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFlashcards(parsed);
      } catch (err) {
        console.error('Error parsing saved flashcards:', err);
      }
    }
  };

  const saveFlashcards = (cards) => {
    localStorage.setItem('studyai_flashcards', JSON.stringify(cards));
  };

  const generateFlashcards = async (documentId = null) => {
    try {
      setGeneratingCards(true);
      setError(null);
      
      const response = await fetch('http://localhost:5000/api/chat/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'flashcards',
          documentId: documentId
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Parse the AI response to extract flashcards
        const newCards = parseFlashcardsFromAI(data.content, documentId);
        
        // Add to existing flashcards
        const updatedCards = [...flashcards, ...newCards];
        setFlashcards(updatedCards);
        saveFlashcards(updatedCards);
        
        // Success message
        alert(`Generated ${newCards.length} new flashcards!`);
      } else {
        setError('Failed to generate flashcards: ' + data.message);
      }
    } catch (err) {
      setError('Error generating flashcards: ' + err.message);
    } finally {
      setGeneratingCards(false);
    }
  };

  const parseFlashcardsFromAI = (content, documentId) => {
    // Parse AI-generated flashcards from the response
    const lines = content.split('\n').filter(line => line.trim());
    const cards = [];
    let currentCard = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for question patterns
      if (line.match(/^(Q:|Question:|\?\d+\.|\d+\.)/i)) {
        if (currentCard.front && currentCard.back) {
          cards.push(currentCard);
        }
        currentCard = {
          id: Date.now() + Math.random(),
          front: line.replace(/^(Q:|Question:|\d+\.)\s*/i, ''),
          back: '',
          topic: extractTopicFromDocument(documentId),
          difficulty: 'medium',
          documentId: documentId,
          created: new Date().toISOString()
        };
      }
      // Look for answer patterns
      else if (line.match(/^(A:|Answer:|Answer:)/i) && currentCard.front) {
        currentCard.back = line.replace(/^(A:|Answer:)\s*/i, '');
      }
      // If we have a front but no back yet, might be a continuation
      else if (currentCard.front && !currentCard.back && line.length > 10) {
        currentCard.back = line;
      }
      // If we have both front and back, might be additional info for back
      else if (currentCard.front && currentCard.back && line.length > 5) {
        currentCard.back += ' ' + line;
      }
    }
    
    // Add the last card
    if (currentCard.front && currentCard.back) {
      cards.push(currentCard);
    }
    
    // If parsing failed, create some basic cards from the content
    if (cards.length === 0) {
      return createBasicCardsFromContent(content, documentId);
    }
    
    return cards.slice(0, 10); // Limit to 10 cards per generation
  };

  const createBasicCardsFromContent = (content, documentId) => {
    // Fallback: create basic cards from content
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const cards = [];
    
    for (let i = 0; i < Math.min(5, sentences.length - 1); i += 2) {
      if (sentences[i] && sentences[i + 1]) {
        cards.push({
          id: Date.now() + Math.random() + i,
          front: sentences[i].trim() + '?',
          back: sentences[i + 1].trim(),
          topic: extractTopicFromDocument(documentId),
          difficulty: 'medium',
          documentId: documentId,
          created: new Date().toISOString()
        });
      }
    }
    
    return cards;
  };

  const extractTopicFromDocument = (documentId) => {
    if (!documentId) return 'general';
    
    const doc = documents.find(d => d.id === documentId);
    if (!doc) return 'general';
    
    const name = doc.name.toLowerCase();
    
    if (name.includes('math') || name.includes('calculus') || name.includes('algebra')) return 'mathematics';
    if (name.includes('bio') || name.includes('anatomy') || name.includes('ecology')) return 'biology';
    if (name.includes('chem') || name.includes('chemical')) return 'chemistry';
    if (name.includes('phys') || name.includes('mechanics')) return 'physics';
    if (name.includes('hist') || name.includes('history')) return 'history';
    if (name.includes('lit') || name.includes('literature') || name.includes('english')) return 'literature';
    if (name.includes('comp') || name.includes('program') || name.includes('code')) return 'computer science';
    
    return 'general';
  };

  const updateTopics = () => {
    const topicCounts = flashcards.reduce((acc, card) => {
      acc[card.topic] = (acc[card.topic] || 0) + 1;
      return acc;
    }, {});
    
    const topicList = [
      { id: 'all', name: 'All Topics', count: flashcards.length }
    ];
    
    Object.entries(topicCounts).forEach(([topic, count]) => {
      topicList.push({
        id: topic,
        name: topic.charAt(0).toUpperCase() + topic.slice(1),
        count: count
      });
    });
    
    setTopics(topicList);
  };

  const filteredCards = selectedTopic === 'all' 
    ? flashcards 
    : flashcards.filter(card => card.topic === selectedTopic);
  
  const currentCard = filteredCards[currentCardIndex];
  
  const handleNext = () => {
    if (currentCardIndex < filteredCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setCurrentCardIndex(0);
    }
  };
  
  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    } else {
      setCurrentCardIndex(filteredCards.length - 1);
    }
  };
  
  const handleMarkKnown = () => {
    setSessionStats(prev => ({
      correct: prev.correct + 1,
      total: prev.total + 1,
      incorrect: prev.incorrect
    }));
    handleNext();
  };
  
  const handleMarkUnknown = () => {
    setSessionStats(prev => ({
      incorrect: prev.incorrect + 1,
      total: prev.total + 1,
      correct: prev.correct
    }));
    handleNext();
  };
  
  const getSuccessRate = () => {
    if (sessionStats.total === 0) return 0;
    return Math.round((sessionStats.correct / sessionStats.total) * 100);
  };
  
  const resetSession = () => {
    setSessionStats({ correct: 0, incorrect: 0, total: 0 });
    setCurrentCardIndex(0);
  };

  const deleteCard = (cardId) => {
    const updatedCards = flashcards.filter(card => card.id !== cardId);
    setFlashcards(updatedCards);
    saveFlashcards(updatedCards);
    
    // Adjust current index if needed
    if (currentCardIndex >= updatedCards.length && updatedCards.length > 0) {
      setCurrentCardIndex(updatedCards.length - 1);
    } else if (updatedCards.length === 0) {
      setCurrentCardIndex(0);
    }
  };

  const shuffleCards = () => {
    const shuffled = [...filteredCards].sort(() => Math.random() - 0.5);
    if (selectedTopic === 'all') {
      setFlashcards(shuffled);
      saveFlashcards(shuffled);
    }
    setCurrentCardIndex(0);
  };
  
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <SectionTitle 
          title="Study Mode"
          subtitle={`Practice with ${flashcards.length} flashcards and track your progress`}
          icon="📚"
        />
        
        <div className="flex gap-2">
          <Button 
            variant={studyMode === 'flashcards' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setStudyMode('flashcards')}
          >
            🃏 Flashcards
          </Button>
          <Button 
            variant={studyMode === 'generate' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setStudyMode('generate')}
          >
            ✨ Generate
          </Button>
          <Button 
            variant={studyMode === 'manage' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setStudyMode('manage')}
          >
            ⚙️ Manage
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-600 mr-2">❌</span>
            <span className="text-red-800">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Topic Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Study Topics</h3>
            <div className="space-y-2">
              {topics.map(topic => (
                <button
                  key={topic.id}
                  onClick={() => {
                    setSelectedTopic(topic.id);
                    setCurrentCardIndex(0);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedTopic === topic.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{topic.name}</span>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                      {topic.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Session Stats */}
          {flashcards.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Session Progress</h3>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {getSuccessRate()}%
                  </div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <div className="text-xl font-semibold text-green-600">
                      {sessionStats.correct}
                    </div>
                    <div className="text-xs text-gray-600">Correct</div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-red-600">
                      {sessionStats.incorrect}
                    </div>
                    <div className="text-xs text-gray-600">Incorrect</div>
                  </div>
                </div>
                
                {filteredCards.length > 0 && (
                  <div className="text-center text-sm text-gray-600">
                    Card {currentCardIndex + 1} of {filteredCards.length}
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetSession}
                  className="w-full"
                >
                  🔄 Reset Session
                </Button>
              </div>
            </div>
          )}
          
          {/* Study Tools */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Study Tools</h3>
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => setStudyMode('generate')}
              >
                ✨ Generate Cards
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start"
                onClick={shuffleCards}
                disabled={filteredCards.length === 0}
              >
                🔀 Shuffle Cards
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => setStudyMode('manage')}
              >
                ⚙️ Manage Cards
              </Button>
            </div>
          </div>
        </div>
        
        {/* Main Study Area */}
        <div className="lg:col-span-3">
          {studyMode === 'flashcards' && (
            <>
              {currentCard ? (
                <div className="space-y-6">
                  <Flashcard
                    front={currentCard.front}
                    back={currentCard.back}
                    difficulty={currentCard.difficulty}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    onMarkKnown={handleMarkKnown}
                    onMarkUnknown={handleMarkUnknown}
                    className="mb-6"
                  />
                  
                  {/* Card Info */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Topic: {currentCard.topic}</span>
                      <span>Difficulty: {currentCard.difficulty}</span>
                      <button
                        onClick={() => deleteCard(currentCard.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm text-gray-500">
                        {currentCardIndex + 1} / {filteredCards.length}
                      </span>
                    </div>
                    <div className="progress-bar bg-gray-200">
                      <div 
                        className="progress-fill bg-blue-600"
                        style={{ width: `${((currentCardIndex + 1) / filteredCards.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    No flashcards available
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {flashcards.length === 0 
                      ? "Generate flashcards from your uploaded documents to start studying"
                      : `No flashcards found for topic: ${selectedTopic}`
                    }
                  </p>
                  <Button 
                    variant="primary"
                    onClick={() => setStudyMode('generate')}
                  >
                    ✨ Generate Flashcards
                  </Button>
                </div>
              )}
            </>
          )}
          
          {studyMode === 'generate' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Generate Flashcards</h3>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">⏳</div>
                  <p>Loading your documents...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <Button
                      variant="gradient"
                      onClick={() => generateFlashcards()}
                      disabled={generatingCards || documents.length === 0}
                      className="mb-4"
                    >
                      {generatingCards ? '⏳ Generating...' : '✨ Generate from All Documents'}
                    </Button>
                    
                    {documents.length === 0 && (
                      <p className="text-sm text-gray-600">
                        No documents found. Upload some study materials first.
                      </p>
                    )}
                  </div>
                  
                  {documents.length > 0 && (
                    <>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Or generate from specific documents:
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {documents.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <div className="font-medium text-gray-900">{doc.name}</div>
                                <div className="text-sm text-gray-600">
                                  {doc.wordCount} words • {doc.pageCount} pages
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateFlashcards(doc.id)}
                                disabled={generatingCards}
                              >
                                Generate
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          
          {studyMode === 'manage' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Manage Flashcards</h3>
              
              {flashcards.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📚</div>
                  <p className="text-gray-600">No flashcards to manage</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {flashcards.length} total flashcards
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Delete all flashcards? This cannot be undone.')) {
                          setFlashcards([]);
                          saveFlashcards([]);
                          setCurrentCardIndex(0);
                        }
                      }}
                    >
                      🗑️ Delete All
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {flashcards.map((card, index) => (
                      <div key={card.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-1">
                              {card.front}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              {card.back.substring(0, 100)}
                              {card.back.length > 100 ? '...' : ''}
                            </div>
                            <div className="flex gap-2 text-xs">
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {card.topic}
                              </span>
                              <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                {card.difficulty}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteCard(card.id)}
                            className="text-red-500 hover:text-red-700 ml-4"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyPage;