import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import SectionTitle from '../components/SectionTitle';

const Home = () => {
  const features = [
    {
      icon: '📤',
      title: 'Upload & Process',
      description: 'Upload PDFs, documents, audio lectures, and notes. Our AI processes and indexes everything for instant access.',
      benefits: ['PDF & Document parsing', 'Audio transcription', 'Smart content extraction']
    },
    {
      icon: '💬',
      title: 'AI Tutor Chat',
      description: 'Chat with your personal AI tutor about any topic from your materials. Get explanations, examples, and clarifications.',
      benefits: ['Instant Q&A', 'Personalized explanations', 'Context-aware responses']
    },
    {
      icon: '🎯',
      title: 'Smart Study Tools',
      description: 'Generate flashcards, quizzes, and summaries automatically. Track your progress and focus on weak areas.',
      benefits: ['Auto-generated flashcards', 'Adaptive quizzes', 'Progress tracking']
    }
  ];
  
  const stats = [
    { number: '10,000+', label: 'Students helped' },
    { number: '50,000+', label: 'Documents processed' },
    { number: '95%', label: 'Improvement rate' },
    { number: '24/7', label: 'AI availability' }
  ];
  
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="page-header text-center py-12">
        <div className="max-w-4xl mx-auto">
          <SectionTitle 
            level={1}
            title="AI-Powered Study Companion"
            align="center"
            className="mb-6"
          />
          <p className="page-subtitle text-xl text-gray-600 mb-8 leading-relaxed">
            Transform how you learn with personalized AI tutoring. Upload your study materials, 
            chat with your AI tutor, and master any subject with intelligent flashcards and quizzes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link to="/upload">
              <Button size="xl" variant="gradient" className="w-full sm:w-auto">
                🚀 Get Started Free
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="xl" variant="outline" className="w-full sm:w-auto">
                📊 View Demo
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-gray-500">
            No credit card required • Process up to 10 documents free
          </p>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="bg-white rounded-2xl shadow-lg p-8">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="stat-number text-3xl font-bold text-blue-600 mb-2">
                {stat.number}
              </div>
              <div className="stat-label text-gray-600 uppercase tracking-wide text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Features Section */}
      <section>
        <SectionTitle 
          level={2}
          title="How StudyAI Works"
          subtitle="Three simple steps to supercharge your learning"
          align="center"
          className="mb-12"
        />
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="feature-card group">
              <div className="feature-icon text-center mb-6">
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 mb-6 text-center leading-relaxed">
                {feature.description}
              </p>
              
              <ul className="space-y-2">
                {feature.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center text-sm text-gray-600">
                    <span className="text-green-500 mr-2">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Transform Your Learning?
        </h2>
        <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
          Join thousands of students who've already improved their study efficiency with AI-powered learning.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/upload">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              Start Learning Now
            </Button>
          </Link>
          <Link to="/about">
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-blue-600">
              Learn More
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;