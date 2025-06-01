import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SectionTitle from '../../components/SectionTitle';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import DashboardService from '../../services/dashboardService';

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await DashboardService.getDashboardData();
      
      if (result.success) {
        setDashboardData(result.data);
      } else {
        setError(result.error);
        setDashboardData(result.data); // Use fallback data
      }
    } catch (err) {
      setError(err.message);
      setDashboardData(DashboardService.getFallbackData());
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <SectionTitle 
          title="Dashboard"
          subtitle="Loading your study analytics..."
          icon="📊"
        />
        <div className="flex justify-center py-12">
          <Loader size="lg" text="Loading dashboard data..." />
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="max-w-6xl mx-auto">
        <SectionTitle 
          title="Dashboard"
          subtitle="Unable to load dashboard data"
          icon="📊"
        />
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Dashboard Unavailable
          </h3>
          <p className="text-gray-600 mb-6">
            {error || 'Unable to load your study data'}
          </p>
          <Button onClick={refreshData}>
            🔄 Try Again
          </Button>
        </div>
      </div>
    );
  }

  const { overview, files, study, content, recentActivity, topicsProgress } = dashboardData;

  // Calculate stats for display
  const stats = [
    {
      title: 'Files Uploaded',
      value: overview.totalFiles.toString(),
      change: `${DashboardService.formatFileSize(overview.totalSize)}`,
      icon: '📄',
      color: 'blue'
    },
    {
      title: 'Words Processed',
      value: content.totalWords.toLocaleString(),
      change: `${content.totalPages} pages`,
      icon: '📝',
      color: 'green'
    },
    {
      title: 'Reading Time',
      value: `${content.estimatedReadingTime}m`,
      change: `${content.contentComplexity} content`,
      icon: '⏱️',
      color: 'purple'
    },
    {
      title: 'Topics Found',
      value: content.topTopics.length.toString(),
      change: `from your materials`,
      icon: '🧠',
      color: 'orange'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500 text-blue-100',
      green: 'bg-green-500 text-green-100',
      purple: 'bg-purple-500 text-purple-100',
      orange: 'bg-orange-500 text-orange-100'
    };
    return colors[color] || colors.blue;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const insights = DashboardService.getStudyInsights(dashboardData);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <SectionTitle 
          title="Dashboard"
          subtitle="Track your learning progress and insights"
          icon="📊"
        />
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshData}>
            🔄 Refresh
          </Button>
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-yellow-600 mr-3">⚠️</span>
            <div>
              <div className="text-yellow-800 font-medium">Using cached data</div>
              <div className="text-yellow-700 text-sm">{error}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats Overview */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${getColorClasses(stat.color)}`}>
                {stat.icon}
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {stat.change}
              </span>
            </div>
            
            <div className="stat-number text-3xl font-bold text-gray-900 mb-1">
              {stat.value}
            </div>
            <div className="stat-label text-sm text-gray-600">
              {stat.title}
            </div>
          </div>
        ))}
      </div>

      {/* Insights Cards */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.map((insight, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">
                  {insight.type === 'success' && '✅'}
                  {insight.type === 'info' && 'ℹ️'}
                  {insight.type === 'tip' && '💡'}
                  {insight.type === 'encourage' && '🚀'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{insight.title}</h3>
                  <p className="text-gray-600 text-sm">{insight.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Content Analysis */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Content Breakdown</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{files.byType.pdf}</div>
              <div className="text-xs text-gray-600">PDF Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{files.byType.doc}</div>
              <div className="text-xs text-gray-600">Documents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{files.byType.audio}</div>
              <div className="text-xs text-gray-600">Audio Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{files.processed}</div>
              <div className="text-xs text-gray-600">Processed</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Content:</span>
              <span className="font-medium">{content.totalWords.toLocaleString()} words</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Average per document:</span>
              <span className="font-medium">{content.averageWordsPerDocument} words</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Reading time:</span>
              <span className="font-medium">{DashboardService.formatDuration(content.estimatedReadingTime)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Last upload:</span>
              <span className="font-medium">{formatDate(overview.lastUpload)}</span>
            </div>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
          
          <div className="space-y-4 custom-scrollbar max-h-80 overflow-y-auto">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-lg">{activity.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-gray-500 text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Topics Progress */}
      {topicsProgress.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Key Topics from Your Content</h3>
            <Link to="/study">
              <Button variant="outline" size="sm">
                🃏 Study These Topics
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topicsProgress.slice(0, 6).map((topic, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900 capitalize">{topic.name}</h4>
                    <p className="text-sm text-gray-600">
                      Found in {topic.totalFiles} document{topic.totalFiles !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {Math.min(topic.progress, 100)}%
                  </span>
                </div>
                
                <div className="progress-bar bg-gray-200">
                  <div 
                    className="progress-fill bg-blue-600"
                    style={{ width: `${Math.min(topic.progress, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <h3 className="text-2xl font-bold mb-4">Ready to Continue Learning?</h3>
        <p className="text-blue-100 mb-6">
          You have {overview.totalFiles} documents with rich content ready to explore.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/upload">
            <Button variant="secondary" className="w-full justify-start">
              <span className="mr-3">📤</span>
              Upload More Content
            </Button>
          </Link>
          
          <Link to="/chat">
            <Button variant="secondary" className="w-full justify-start">
              <span className="mr-3">💬</span>
              Ask About Topics
            </Button>
          </Link>
          
          <Link to="/study">
            <Button variant="secondary" className="w-full justify-start">
              <span className="mr-3">🃏</span>
              Generate Flashcards
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;