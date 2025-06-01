import React from 'react';

const Loader = ({ 
  size = 'md', 
  variant = 'spinner', 
  text = '',
  className = '',
  fullscreen = false 
}) => {
  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  
  const SpinnerLoader = () => (
    <div className={`border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin ${sizes[size]}`} />
  );
  
  const DotsLoader = () => (
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
  
  const PulseLoader = () => (
    <div className={`bg-blue-600 rounded-full animate-pulse ${sizes[size]}`} />
  );
  
  const BrainLoader = () => (
    <div className="flex flex-col items-center">
      <div className="text-4xl animate-bounce mb-2">🧠</div>
      <div className="text-sm text-gray-600">Thinking...</div>
    </div>
  );
  
  const getLoader = () => {
    switch(variant) {
      case 'dots': return <DotsLoader />;
      case 'pulse': return <PulseLoader />;
      case 'brain': return <BrainLoader />;
      default: return <SpinnerLoader />;
    }
  };
  
  const content = (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      {getLoader()}
      {text && <p className="text-sm text-gray-600 text-center max-w-xs">{text}</p>}
    </div>
  );
  
  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl shadow-xl">
          {content}
        </div>
      </div>
    );
  }
  
  return content;
};

export default Loader;