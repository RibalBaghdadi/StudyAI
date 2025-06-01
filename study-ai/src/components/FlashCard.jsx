import React, { useState } from 'react';
import Button from './Button';

const Flashcard = ({ 
  front, 
  back, 
  onNext, 
  onPrevious, 
  onMarkKnown, 
  onMarkUnknown,
  showControls = true,
  className = '',
  difficulty = 'medium' // easy, medium, hard
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };
  
  const handleKeyPress = (e) => {
    switch(e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault();
        handleFlip();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onPrevious?.();
        break;
      case 'ArrowRight':
        e.preventDefault();
        onNext?.();
        break;
      case '1':
        e.preventDefault();
        onMarkKnown?.();
        break;
      case '2':
        e.preventDefault();
        onMarkUnknown?.();
        break;
    }
  };
  
  const getDifficultyColor = () => {
    switch(difficulty) {
      case 'easy': return 'border-green-200 bg-green-50';
      case 'hard': return 'border-red-200 bg-red-50';
      default: return 'border-yellow-200 bg-yellow-50';
    }
  };
  
  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {/* Difficulty Indicator */}
      {difficulty && (
        <div className="flex justify-center mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getDifficultyColor()}`}>
            {difficulty}
          </span>
        </div>
      )}
      
      {/* Flashcard */}
      <div 
        className={`
          flashcard relative min-h-[300px] max-h-[400px] overflow-hidden cursor-pointer
          transform-gpu transition-all duration-500 preserve-3d
          ${isFlipped ? 'rotate-y-180' : ''}
        `}
        onClick={handleFlip}
        tabIndex={0}
        onKeyPress={handleKeyPress}
      >
        {/* Front Side */}
        <div className={`
          flashcard-front absolute inset-0 backface-hidden
          ${isFlipped ? 'opacity-0' : 'opacity-100'}
        `}>
          <div className="h-full flex flex-col justify-center items-center p-8">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-4 uppercase tracking-wide">Question</div>
              <div className="flashcard-content text-xl leading-relaxed">
                {front}
              </div>
            </div>
            <div className="absolute bottom-4 text-sm text-gray-400">
              Click to reveal answer
            </div>
          </div>
        </div>
        
        {/* Back Side */}
        <div className={`
          flashcard-back absolute inset-0 backface-hidden rotate-y-180
          ${isFlipped ? 'opacity-100' : 'opacity-0'}
        `}>
          <div className="h-full flex flex-col justify-center items-center p-8">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-4 uppercase tracking-wide">Answer</div>
              <div className="flashcard-content text-xl leading-relaxed">
                {back}
              </div>
            </div>
            <div className="absolute bottom-4 text-sm text-gray-400">
              Click to flip back
            </div>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      {showControls && (
        <div className="mt-6 space-y-4">
          {/* Knowledge Assessment (only shown when flipped) */}
          {isFlipped && (
            <div className="flex justify-center gap-4">
              <Button 
                variant="danger" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkUnknown?.();
                  setIsFlipped(false);
                }}
                className="flex items-center gap-2"
              >
                ❌ Don't Know
              </Button>
              <Button 
                variant="success" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkKnown?.();
                  setIsFlipped(false);
                }}
                className="flex items-center gap-2"
              >
                ✅ Know It
              </Button>
            </div>
          )}
          
          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPrevious?.();
                setIsFlipped(false);
              }}
              className="flex items-center gap-2"
            >
              ← Previous
            </Button>
            
            <div className="text-sm text-gray-500 space-x-4">
              <span>Space: Flip</span>
              <span>← →: Navigate</span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onNext?.();
                setIsFlipped(false);
              }}
              className="flex items-center gap-2"
            >
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Flashcard;