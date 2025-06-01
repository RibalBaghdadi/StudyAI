import React from 'react';
import Navbar from '../components/Navbar';

const MainLayout = ({ children, className = '' }) => {
  return (
    <div className={`app-container min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 ${className}`}>
      <Navbar />
      <main className="main-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <span className="text-2xl">🧠</span>
              <span className="font-semibold text-gray-800">StudyAI</span>
              <span className="text-gray-500">© 2025</span>
            </div>
            
            <div className="flex space-x-6 text-sm text-gray-600">
              <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Help</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;