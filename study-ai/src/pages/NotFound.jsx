import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center space-y-8 max-w-md mx-auto px-4">
        <div className="space-y-4">
          <div className="text-8xl">🤖</div>
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700">Page Not Found</h2>
          <p className="text-gray-600 leading-relaxed">
            Oops! It looks like this page got lost in the neural network. 
            Don't worry, our AI is still here to help you study!
          </p>
        </div>
        
        <div className="space-y-4">
          <Link to="/">
            <Button variant="gradient" size="lg" className="w-full">
              🏠 Go Home
            </Button>
          </Link>
          
          <div className="flex gap-3">
            <Link to="/upload" className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                📤 Upload
              </Button>
            </Link>
            <Link to="/chat" className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                💬 Chat
              </Button>
            </Link>
            <Link to="/study" className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                📚 Study
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          Need help? <Link to="/chat" className="text-blue-600 hover:underline">Ask our AI assistant</Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;