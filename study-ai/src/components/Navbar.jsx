import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from './Button';

const Navbar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isActive = (path) => location.pathname === path;
  
  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/upload', label: 'Upload', icon: '📤' },
    { path: '/chat', label: 'Chat', icon: '💬' },
    { path: '/study', label: 'Study', icon: '📚' }
  ];
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  return (
    <nav className="navbar sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          <Link to="/" className="navbar-brand flex items-center space-x-3">
            <div className="text-3xl">🧠</div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                StudyAI
              </span>
              <div className="text-xs text-gray-500">Smart Learning Companion</div>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? 'nav-link-active bg-blue-100 text-blue-700'
                    : 'nav-link-inactive text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <Button variant="ghost" size="sm">
              ⚙️ Settings
            </Button>
            <Button variant="outline" size="sm">
              👤 Profile
            </Button>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="p-2"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-white">
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link flex items-center space-x-3 px-4 py-3 text-base font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'nav-link-active bg-blue-100 text-blue-700'
                      : 'nav-link-inactive text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              
              <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                <Button variant="ghost" size="sm" className="w-full justify-start px-4 py-3">
                  <span className="mr-3">⚙️</span>
                  Settings
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start px-4 py-3">
                  <span className="mr-3">👤</span>
                  Profile
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;