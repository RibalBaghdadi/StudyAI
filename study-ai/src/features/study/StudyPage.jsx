import React, { useState } from 'react';
import Flashcard from '../../components/FlashCard';
import SectionTitle from '../../components/SectionTitle';
import Button from '../../components/Button';

const StudyPage = () => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [studyMode, setStudyMode] = useState('flashcards'); // flashcards, quiz, review
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    total: 0
  });
  
  // Mock flashcard data
  const flashcards = [
    {
      id: 1,
      front: "What is photosynthesis?",
      back: "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar.",
      topic: "biology",
      difficulty: "medium"
    },
    {
      id: 2,
      front: "What is the chemical formula for water?",
      back: "H₂O - Two hydrogen atoms bonded to one oxygen atom.",
      topic: "chemistry",
      difficulty: "easy"
    },
    {
      id: 3,
      front: "Define Newton's First Law of Motion",
      back: "An object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction, unless acted upon by an unbalanced force.",
      topic: "physics",
      difficulty: "medium"
    },
    {
      id: 4,
      front: "What is the quadratic formula?",
      back: "x = (-b ± √(b² - 4ac)) / 2a, used to solve quadratic equations of the form ax² + bx + c = 0",
      topic: "math",
      difficulty: "hard"
    },
    {
      id: 5,
      front: "Who wrote 'Romeo and Juliet'?",
      back: "William Shakespeare wrote this famous tragedy in the early part of his career, around 1594-1596.",
      topic: "literature",
      difficulty: "easy"
    }
  ];
  
  const topics = [
    { id: 'all', name: 'All Topics', count: flashcards.length },
    { id: 'biology', name: 'Biology', count: flashcards.filter(c => c.topic === 'biology').length },
    { id: 'chemistry', name: 'Chemistry', count: flashcards.filter(c => c.topic === 'chemistry').length },
    { id: 'physics', name: 'Physics', count: flashcards.filter(c => c.topic === 'physics').length },
    { id: 'math', name: 'Mathematics', count: flashcards.filter(c => c.topic === 'math').length },
    { id: 'literature', name: 'Literature', count: flashcards.filter(c => c.topic === 'literature').length }
  ];
  
  const filteredCards = selectedTopic === 'all' 
    ? flashcards 
    : flashcards.filter(card => card.topic === selectedTopic);
  
  const currentCard = filteredCards[currentCardIndex];
  
  const handleNext = () => {
    if (currentCardIndex < filteredCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setCurrentCardIndex(0); // Loop back to start
    }
  };
  
  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    } else {
      setCurrentCardIndex(filteredCards.length - 1); // Loop to end
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
  
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <SectionTitle 
          title="Study Mode"
          subtitle="Practice with flashcards and track your progress"
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
            variant={studyMode === 'quiz' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setStudyMode('quiz')}
          >
            ❓ Quiz
          </Button>
          <Button 
            variant={studyMode === 'review' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setStudyMode('review')}
          >
            📝 Review
          </Button>
        </div>
      </div>
      
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
              
              <div className="text-center text-sm text-gray-600">
                Card {currentCardIndex + 1} of {filteredCards.length}
              </div>
              
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
          
          {/* Study Tools */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Study Tools</h3>
            <div className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                🎯 Generate Quiz
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                📊 View Analytics
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                🔀 Shuffle Cards
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                ⭐ Favorites Only
              </Button>
            </div>
          </div>
        </div>
        
        {/* Main Study Area */}
        <div className="lg:col-span-3">
          {studyMode === 'flashcards' && currentCard && (
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
          )}
          
          {studyMode === 'quiz' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="text-6xl mb-4">🚧</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Quiz Mode Coming Soon</h3>
              <p className="text-gray-600 mb-6">
                Interactive quizzes with multiple choice questions and instant feedback will be available soon.
              </p>
              <Button variant="primary">
                🔔 Notify Me When Ready
              </Button>
            </div>
          )}
          
          {studyMode === 'review' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Study Review</h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">✅ Mastered Cards</h4>
                    <p className="text-green-700 text-sm mb-3">
                      Cards you've consistently answered correctly
                    </p>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.floor(filteredCards.length * 0.6)}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2">📚 Need Review</h4>
                    <p className="text-yellow-700 text-sm mb-3">
                      Cards that need more practice
                    </p>
                    <div className="text-2xl font-bold text-yellow-600">
                      {Math.floor(filteredCards.length * 0.4)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Recent Study Activity</h4>
                  <div className="space-y-2">
                    {[
                      { topic: 'Biology', cards: 15, time: '25 min ago' },
                      { topic: 'Chemistry', cards: 8, time: '1 hour ago' },
                      { topic: 'Physics', cards: 12, time: '2 hours ago' }
                    ].map((activity, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">{activity.topic}</span>
                          <span className="text-gray-600 ml-2">• {activity.cards} cards</span>
                        </div>
                        <span className="text-sm text-gray-500">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Empty State */}
      {filteredCards.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No flashcards available for {selectedTopic}
          </h3>
          <p className="text-gray-600 mb-6">
            Upload some study materials to automatically generate flashcards
          </p>
          <Button variant="gradient">
            📤 Upload Materials
          </Button>
        </div>
      )}
    </div>
  );
};

export default StudyPage;