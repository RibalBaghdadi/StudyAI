import React from 'react';

const MessageBubble = ({ 
  message, 
  sender = 'user', // 'user' or 'ai'
  timestamp,
  isTyping = false,
  className = '' 
}) => {
  const isUser = sender === 'user';
  
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const TypingIndicator = () => (
    <div className="flex space-x-1 p-2">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
  
  return (
    <div className={`message-bubble flex ${isUser ? 'justify-end' : 'justify-start'} ${className}`}>
      <div className={`flex items-start space-x-2 max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          {isUser ? '👤' : '🧠'}
        </div>
        
        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`
            px-4 py-2 rounded-2xl message-fade-in
            ${isUser 
              ? 'bg-blue-600 text-white rounded-br-md' 
              : 'bg-gray-100 text-gray-800 rounded-bl-md'
            }
          `}>
            {isTyping ? <TypingIndicator /> : (
              <div className="whitespace-pre-wrap break-words">
                {message}
              </div>
            )}
          </div>
          
          {/* Timestamp */}
          {timestamp && !isTyping && (
            <span className="message-timestamp text-xs text-gray-500 mt-1 px-1">
              {formatTimestamp(timestamp)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;