import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SectionTitle from '../../components/SectionTitle';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import DashboardService from '../../services/dashboardService';
import UploadService from '../../services/uploadService';
import DeleteService from '../../services/deleteService';

// Try to import the modal, fallback to null if not available
let DeleteConfirmationModal = null;
try {
  DeleteConfirmationModal = require('../../components/DeleteConfirmationModal').default;
} catch (error) {
  console.log('DeleteConfirmationModal not found, using fallback confirmations');
}

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [deleting, setDeleting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showFileManager, setShowFileManager] = useState(false);
  
  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: 'single', // 'single', 'bulk', 'all'
    item: null,
    items: []
  });

  useEffect(() => {
    loadDashboardData();
    loadUploadedFiles();
  }, []);

  // Auto-dismiss messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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

  const loadUploadedFiles = async () => {
    try {
      const response = await UploadService.getUploadedFiles();
      if (response.success && response.documents) {
        const mappedFiles = response.documents.map(doc => ({
          id: doc.id,
          name: doc.originalName || doc.name, // Use originalName first
          originalName: doc.originalName || doc.name,
          size: doc.size,
          type: doc.type,
          uploadDate: doc.uploadDate,
          pageCount: doc.pageCount,
          wordCount: doc.wordCount,
          summary: doc.summary,
          status: doc.hasExtractedContent ? 'Processed' : 'Processing',
          hasExtractedContent: doc.hasExtractedContent
        }));
        setUploadedFiles(mappedFiles);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const refreshData = async () => {
    await loadDashboardData();
    await loadUploadedFiles();
    setSuccessMessage('✅ Dashboard refreshed!');
  };

  const handleSingleDelete = async (file) => {
    if (DeleteConfirmationModal) {
      setDeleteModal({
        isOpen: true,
        type: 'single',
        item: file,
        items: []
      });
    } else {
      // Fallback to browser confirm
      const confirmed = window.confirm(`Are you sure you want to delete "${file.name}"?\n\nThis action cannot be undone.`);
      if (confirmed) {
        executeDeleteFallback('single', file);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) {
      setError('Please select files to delete');
      return;
    }

    const filesToDelete = uploadedFiles.filter(file => selectedFiles.has(file.id));
    
    if (DeleteConfirmationModal) {
      setDeleteModal({
        isOpen: true,
        type: 'bulk',
        item: null,
        items: filesToDelete
      });
    } else {
      // Fallback to browser confirm
      const confirmed = window.confirm(
        `Are you sure you want to delete ${filesToDelete.length} selected file${filesToDelete.length > 1 ? 's' : ''}?\n\nThis action cannot be undone.`
      );
      if (confirmed) {
        executeDeleteFallback('bulk', null, filesToDelete);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (DeleteConfirmationModal) {
      setDeleteModal({
        isOpen: true,
        type: 'all',
        item: null,
        items: uploadedFiles
      });
    } else {
      // Fallback to browser confirm with double confirmation
      const confirmed1 = window.confirm(`⚠️ WARNING: This will permanently delete ALL ${uploadedFiles.length} uploaded files!\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?`);
      if (confirmed1) {
        const confirmed2 = window.confirm(`🚨 FINAL CONFIRMATION 🚨\n\nYou are about to DELETE ALL ${uploadedFiles.length} files permanently.\n\nClick OK to proceed or Cancel to abort.`);
        if (confirmed2) {
          executeDeleteFallback('all');
        }
      }
    }
  };

  const executeDeleteFallback = async (type, item = null, items = []) => {
    setDeleting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (type === 'single') {
        await DeleteService.handleDelete(
          item,
          (message) => {
            setUploadedFiles(prev => prev.filter(f => f.id !== item.id));
            setSuccessMessage(message);
            loadDashboardData();
          },
          (errorMsg) => {
            setError(errorMsg);
          }
        );
      } else if (type === 'bulk') {
        const results = await DeleteService.bulkDeleteDocuments(
          items,
          () => {}
        );

        if (results.successful.length > 0) {
          const deletedIds = results.successful.map(r => r.document.id);
          setUploadedFiles(prev => prev.filter(file => !deletedIds.includes(file.id)));
          setSelectedFiles(new Set());
          setBulkMode(false);
          loadDashboardData();
        }

        if (results.failed.length === 0) {
          setSuccessMessage(`✅ Successfully deleted ${results.successful.length} file${results.successful.length > 1 ? 's' : ''}!`);
        } else {
          const message = `⚠️ Deleted ${results.successful.length} files, ${results.failed.length} failed`;
          setError(message);
        }
      } else if (type === 'all') {
        await DeleteService.handleDelete(
          null,
          (message) => {
            setUploadedFiles([]);
            setSelectedFiles(new Set());
            setBulkMode(false);
            setSuccessMessage(message);
            loadDashboardData();
          },
          (errorMsg) => {
            setError(errorMsg);
          }
        );
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setDeleting(false);
    }
  };

  const executeDelete = async () => {
    setDeleting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (deleteModal.type === 'single') {
        // Single file delete
        await DeleteService.handleDelete(
          deleteModal.item,
          (message) => {
            setUploadedFiles(prev => prev.filter(f => f.id !== deleteModal.item.id));
            setSuccessMessage(message);
            setDeleteModal({ isOpen: false, type: 'single', item: null, items: [] });
            loadDashboardData();
          },
          (errorMsg) => {
            setError(errorMsg);
            setDeleteModal({ isOpen: false, type: 'single', item: null, items: [] });
          }
        );
      } else if (deleteModal.type === 'bulk') {
        // Bulk delete
        const results = await DeleteService.bulkDeleteDocuments(
          deleteModal.items,
          () => {} // Progress callback not needed here
        );

        if (results.successful.length > 0) {
          const deletedIds = results.successful.map(r => r.document.id);
          setUploadedFiles(prev => prev.filter(file => !deletedIds.includes(file.id)));
          setSelectedFiles(new Set());
          setBulkMode(false);
          loadDashboardData();
        }

        if (results.failed.length === 0) {
          setSuccessMessage(`✅ Successfully deleted ${results.successful.length} file${results.successful.length > 1 ? 's' : ''}!`);
        } else {
          const message = `⚠️ Deleted ${results.successful.length} files, ${results.failed.length} failed`;
          setError(message);
        }
        setDeleteModal({ isOpen: false, type: 'bulk', item: null, items: [] });
      } else if (deleteModal.type === 'all') {
        // Delete all
        await DeleteService.handleDelete(
          null, // null means delete all
          (message) => {
            setUploadedFiles([]);
            setSelectedFiles(new Set());
            setBulkMode(false);
            setSuccessMessage(message);
            setDeleteModal({ isOpen: false, type: 'all', item: null, items: [] });
            loadDashboardData();
          },
          (errorMsg) => {
            setError(errorMsg);
            setDeleteModal({ isOpen: false, type: 'all', item: null, items: [] });
          }
        );
      }
    } catch (error) {
      setError(error.message);
      setDeleteModal({ isOpen: false, type: deleteModal.type, item: null, items: [] });
    } finally {
      setDeleting(false);
    }
  };

  const toggleFileSelection = (fileId) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const selectAllFiles = () => {
    const allIds = uploadedFiles.map(file => file.id);
    setSelectedFiles(new Set(allIds));
  };

  const clearSelection = () => {
    setSelectedFiles(new Set());
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'txt': return '📃';
      case 'mp3':
      case 'wav':
      case 'm4a': return '🎵';
      case 'ppt':
      case 'pptx': return '📊';
      default: return '📁';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      value: uploadedFiles.length.toString(),
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

  const insights = DashboardService.getStudyInsights(dashboardData);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <SectionTitle 
          title="Dashboard"
          subtitle="Track your learning progress and manage your files"
          icon="📊"
        />
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFileManager(!showFileManager)}
          >
            🗂️ {showFileManager ? 'Hide' : 'Manage Files'}
          </Button>
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

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <span className="text-green-500 mr-3 mt-1">✅</span>
              <div className="text-green-800">{successMessage}</div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSuccessMessage(null)}
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <span className="text-red-500 mr-3 mt-1">❌</span>
              <div>
                <div className="text-red-800 font-medium mb-1">Error</div>
                <div className="text-red-700 text-sm">{error}</div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
            >
              ✕
            </Button>
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

      {/* File Manager */}
      {showFileManager && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">File Manager</h3>
            <div className="flex gap-2">
              <Button
                variant={bulkMode ? "primary" : "outline"}
                size="sm"
                onClick={() => setBulkMode(!bulkMode)}
              >
                {bulkMode ? "✓ Select Mode" : "📝 Select Mode"}
              </Button>
              
              {bulkMode && selectedFiles.size > 0 && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={deleting}
                >
                  {deleting ? <Loader size="sm" className="mr-2" /> : "🗑️"}
                  Delete Selected ({selectedFiles.size})
                </Button>
              )}
              
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteAll}
                disabled={deleting || uploadedFiles.length === 0}
              >
                {deleting ? <Loader size="sm" className="mr-2" /> : "🗑️"}
                Delete All
              </Button>
            </div>
          </div>

          {bulkMode && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={selectAllFiles}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Clear Selection
                </Button>
                <span className="text-sm text-blue-700">
                  {selectedFiles.size} of {uploadedFiles.length} files selected
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {uploadedFiles.length > 0 ? (
              uploadedFiles.map(file => (
                <div key={file.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    {bulkMode && (
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.id)}
                        onChange={() => toggleFileSelection(file.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    )}
                    
                    <div className="text-2xl">{getFileIcon(file.name)}</div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{file.name}</h4>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>📏 {UploadService.formatFileSize(file.size)}</span>
                        {file.wordCount && <span>📝 {file.wordCount.toLocaleString()} words</span>}
                        <span>📅 {formatDateTime(file.uploadDate)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                      {file.status}
                    </span>
                    
                    <Button 
                      size="sm" 
                      variant="danger"
                      onClick={() => handleSingleDelete(file)}
                      disabled={deleting}
                    >
                      {deleting ? <Loader size="sm" /> : "🗑️"}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-gray-500 text-sm">No files uploaded yet</p>
                <Link to="/upload">
                  <Button variant="outline" size="sm" className="mt-3">
                    📤 Upload Files
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

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
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Files</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowFileManager(!showFileManager)}
            >
              {showFileManager ? 'Hide' : 'Manage'}
            </Button>
          </div>
          
          <div className="space-y-4 custom-scrollbar max-h-80 overflow-y-auto">
            {uploadedFiles.length > 0 ? (
              uploadedFiles.slice(0, 5).map((file) => (
                <div key={file.id} className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                  <div className="flex items-start space-x-3">
                    <div className="text-lg">{getFileIcon(file.name)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {UploadService.formatFileSize(file.size)} • {formatDate(file.uploadDate)}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleSingleDelete(file)}
                    disabled={deleting}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    {deleting ? <Loader size="sm" /> : "🗑️"}
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-gray-500 text-sm">No files uploaded yet</p>
                <Link to="/upload">
                  <Button variant="outline" size="sm" className="mt-3">
                    📤 Upload Files
                  </Button>
                </Link>
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
          You have {uploadedFiles.length} documents with rich content ready to explore.
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