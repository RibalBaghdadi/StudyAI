import React from 'react';
import { Link } from 'react-router-dom';
import SectionTitle from '../components/SectionTitle';
import Button from '../components/Button';

const About = () => {
  const features = [
    {
      icon: '🧠',
      title: 'AI-Powered Learning',
      description: 'Advanced natural language processing analyzes your materials and creates personalized learning experiences.'
    },
    {
      icon: '📄',
      title: 'Document Processing',
      description: 'Upload PDFs, documents, and audio files. Our AI extracts key concepts and creates searchable content.'
    },
    {
      icon: '💬',
      title: 'Interactive Tutoring',
      description: 'Chat with your AI tutor about any topic. Get explanations, examples, and clarifications instantly.'
    },
    {
      icon: '🃏',
      title: 'Smart Flashcards',
      description: 'Automatically generated flashcards with spaced repetition to optimize your learning retention.'
    },
    {
      icon: '📊',
      title: 'Progress Tracking',
      description: 'Detailed analytics help you identify weak areas and track your improvement over time.'
    },
    {
      icon: '🎯',
      title: 'Adaptive Learning',
      description: 'The system adapts to your learning style and pace, focusing on areas that need attention.'
    }
  ];
  
  const techStack = [
    { name: 'OpenAI GPT', purpose: 'Natural language understanding and generation' },
    { name: 'Whisper AI', purpose: 'Audio transcription and processing' },
    { name: 'Vector Database', purpose: 'Semantic search and content retrieval' },
    { name: 'React', purpose: 'Interactive user interface' },
    { name: 'Machine Learning', purpose: 'Adaptive learning algorithms' }
  ];
  
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center">
        <SectionTitle 
          level={1}
          title="About StudyAI"
          subtitle="Revolutionizing education with artificial intelligence"
          icon="🧠"
          align="center"
        />
        
        <div className="max-w-3xl mx-auto text-lg text-gray-700 leading-relaxed">
          <p className="mb-6">
            StudyAI is an innovative learning platform that combines the power of artificial intelligence 
            with proven educational techniques to create a personalized study experience. Our mission is 
            to make learning more efficient, engaging, and accessible for students everywhere.
          </p>
          
          <p>
            By leveraging advanced AI technologies, we transform your study materials into interactive 
            learning experiences that adapt to your unique learning style and pace.
          </p>
        </div>
      </section>
      
      {/* Features Grid */}
      <section>
        <SectionTitle 
          level={2}
          title="Powerful Features"
          subtitle="Everything you need for effective studying"
          align="center"
          className="mb-12"
        />
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="feature-card text-center">
              <div className="feature-icon text-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
      
      {/* Technology Section */}
      <section className="bg-white rounded-2xl shadow-lg p-12">
        <SectionTitle 
          level={2}
          title="Technology Stack"
          subtitle="Built with cutting-edge AI and web technologies"
          align="center"
          className="mb-8"
        />
        
        <div className="grid md:grid-cols-2 gap-6">
          {techStack.map((tech, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-3 h-3 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-semibold text-gray-900">{tech.name}</h4>
                <p className="text-gray-600 text-sm">{tech.purpose}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Mission Section */}
      <section className="text-center">
        <SectionTitle 
          level={2}
          title="Our Mission"
          align="center"
          className="mb-8"
        />
        
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="space-y-4">
              <div className="text-4xl">🎯</div>
              <h3 className="text-xl font-semibold">Accessibility</h3>
              <p className="text-gray-600">
                Make quality education accessible to everyone, regardless of their learning style or background.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="text-4xl">⚡</div>
              <h3 className="text-xl font-semibold">Efficiency</h3>
              <p className="text-gray-600">
                Reduce study time while increasing retention through personalized, AI-driven learning paths.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="text-4xl">🚀</div>
              <h3 className="text-xl font-semibold">Innovation</h3>
              <p className="text-gray-600">
                Continuously evolve our platform with the latest advances in AI and educational research.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white text-center">
        <SectionTitle 
          level={2}
          title="StudyAI by the Numbers"
          align="center"
          className="mb-8 text-white"
        />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="text-4xl font-bold mb-2">10,000+</div>
            <div className="text-blue-100">Active Students</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">500,000+</div>
            <div className="text-blue-100">Documents Processed</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">95%</div>
            <div className="text-blue-100">Satisfaction Rate</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">50+</div>
            <div className="text-blue-100">Universities</div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="text-center">
        <SectionTitle 
          level={2}
          title="Ready to Start Learning?"
          subtitle="Join thousands of students who are already studying smarter with AI"
          align="center"
          className="mb-8"
        />
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/upload">
            <Button size="xl" variant="gradient" className="w-full sm:w-auto">
              🚀 Get Started Free
            </Button>
          </Link>
          <Link to="/chat">
            <Button size="xl" variant="outline" className="w-full sm:w-auto">
              💬 Try AI Chat
            </Button>
          </Link>
        </div>
        
        <p className="text-sm text-gray-500 mt-4">
          No credit card required • Free tier includes 10 document uploads
        </p>
      </section>
    </div>
  );
};

export default About;