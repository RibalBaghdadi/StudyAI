import React, { useState, useRef } from 'react';
import Button from './Button';
import TextArea from './TextArea';

const ChatInput = ({ 
  onSendMessage, 
  placeholder = "Ask a question about your study materials...",
  disabled = false,
  maxLength = 1000,
  className = ''
}) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const textAreaRef = useRef(null);
  
  const handleSend = async () => {
    if (!message.trim() || disabled || isLoading) return;
    
    const messageToSend = message.trim();
    setMessage('');
    setIsLoading(true);
    
    try {
      await onSendMessage(messageToSend);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message on error
      setMessage(messageToSend);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    if (message.length + pastedText.length > maxLength) {
      e.preventDefault();
      alert(`Message too long. Maximum ${maxLength} characters allowed.`);
    }
  };
  
  return (
    <div className={`chat-input-container bg-white border-t border-gray-200 p-4 ${className}`}>
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <TextArea
            ref={textAreaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={1}
            maxLength={maxLength}
            className="min-h-[40px] max-h-[120px] resize-none"
            style={{ 
              height: 'auto',
              minHeight: '40px'
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
        </div>
        
        <div className="flex gap-2">
          {/* Quick Actions */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessage(message + " Can you explain this in simple terms?")}
              disabled={disabled || isLoading}
              title="Ask for simple explanation"
            >
              💡
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessage(message + " Can you create flashcards for this topic?")}
              disabled={disabled || isLoading}
              title="Request flashcards"
            >
              🃏
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessage(message + " Can you quiz me on this?")}
              disabled={disabled || isLoading}
              title="Request quiz"
            >
              ❓
            </Button>
          </div>
          
          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled || isLoading}
            loading={isLoading}
            variant="primary"
            size="sm"
            className="px-4"
          >
            {isLoading ? '' : '📤'}
          </Button>
        </div>
      </div>
      
      {/* Helper Text */}
      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
        <span>Press Enter to send, Shift+Enter for new line</span>
        <span>{message.length}/{maxLength}</span>
      </div>
    </div>
  );
};

export default ChatInput;