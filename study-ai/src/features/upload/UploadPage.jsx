import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FileDropZone from '../../components/FileDropZone';
import Button from '../../components/Button';
import SectionTitle from '../../components/SectionTitle';
import Loader from '../../components/Loader';
import UploadService from '../../services/uploadService';

const UploadPage = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');

  // Check backend health on component mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      await UploadService.checkHealth();
      setBackendStatus('connected');
    } catch (error) {
      console.error('Backend health check failed:', error);
      setBackendStatus('disconnected');
    }
  };

  const handleFileUpload = async (files) => {
    setProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      // Validate files first
      const validationErrors = [];
      files.forEach(file => {
        const validation = UploadService.validateFile(file);
        if (!validation.valid) {
          validationErrors.push(...validation.errors);
        }
      });

      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('\n'));
      }

      // Upload files with progress tracking
      const response = await UploadService.uploadFilesWithProgress(
        files,
        (progress) => setProcessingProgress(progress)
      );

      // Add processed files to state
      if (response.files && response.files.length > 0) {
        setUploadedFiles(prev => [...prev, ...response.files]);
      }

      // Show success message
      console.log('Upload successful:', response);

    } catch (error) {
      console.error('Upload failed:', error);
      setError(error.message);
    } finally {
      setProcessing(false);
      setProcessingProgress(0);
    }
  };

  const deleteFile = async (fileId) => {
    try {
      await UploadService.deleteFile(fileId);
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Delete failed:', error);
      setError('Failed to delete file');
    }
  };

  const retryConnection = () => {
    setBackendStatus('checking');
    checkBackendHealth();
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
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Backend connection status component
  const BackendStatus = () => {
    if (backendStatus === 'checking') {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Loader size="sm" className="mr-3" />
            <span className="text-yellow-800">Connecting to backend...</span>
          </div>
        </div>
      );
    }

    if (backendStatus === 'disconnected') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-red-600 mr-3">⚠️</span>
              <div>
                <div className="text-red-800 font-medium">Backend Disconnected</div>
                <div className="text-red-600 text-sm">Make sure your backend server is running on port 5000</div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={retryConnection}>
              🔄 Retry
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <span className="text-green-600 mr-3">✅</span>
          <span className="text-green-800">Connected to backend server</span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <SectionTitle 
        title="Upload Study Materials"
        subtitle="Upload your documents, PDFs, and audio files to build your personalized knowledge base"
        icon="📤"
      />

      {/* Backend Status */}
      <BackendStatus />
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start">
            <span className="text-red-500 mr-3 mt-1">❌</span>
            <div>
              <div className="text-red-800 font-medium mb-1">Upload Error</div>
              <div className="text-red-700 text-sm whitespace-pre-line">{error}</div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <FileDropZone 
          onFileUpload={handleFileUpload}
          acceptedTypes=".pdf,.txt,.doc,.docx,.ppt,.pptx,.mp3,.wav,.m4a"
          maxFiles={10}
          maxSize={50 * 1024 * 1024} // 50MB
          className={backendStatus !== 'connected' ? 'opacity-50 pointer-events-none' : ''}
        />
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl mb-2">📄</div>
            <div className="text-sm font-medium text-gray-700">Documents</div>
            <div className="text-xs text-gray-500">PDF, DOC, TXT, PPT</div>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl mb-2">🎵</div>
            <div className="text-sm font-medium text-gray-700">Audio Files</div>
            <div className="text-xs text-gray-500">MP3, WAV, M4A</div>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl mb-2">🧠</div>
            <div className="text-sm font-medium text-gray-700">AI Processing</div>
            <div className="text-xs text-gray-500">Auto transcription & analysis</div>
          </div>
        </div>
      </div>
      
      {/* Processing Status */}
      {processing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-900">Processing Files...</h3>
            <span className="text-blue-700 font-medium">{processingProgress}%</span>
          </div>
          
          <div className="progress-bar bg-blue-200 mb-4">
            <div 
              className="progress-fill bg-blue-600 transition-all duration-300"
              style={{ width: `${processingProgress}%` }}
            />
          </div>
          
          <div className="flex items-center text-blue-800">
            <Loader size="sm" className="mr-3" />
            <span className="text-sm">
              Uploading and processing files...
            </span>
          </div>
        </div>
      )}
      
      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Your Knowledge Base ({uploadedFiles.length} files)
            </h2>
            
            <div className="flex gap-2">
              <Link to="/chat">
                <Button variant="primary" size="sm">
                  💬 Start Chatting
                </Button>
              </Link>
              <Link to="/study">
                <Button variant="outline" size="sm">
                  📚 Study Mode
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="space-y-4">
            {uploadedFiles.map(file => (
              <div key={file.id} className="uploaded-file-item p-6 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">{getFileIcon(file.name)}</div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{file.name}</h3>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                        <span>📏 {UploadService.formatFileSize(file.size)}</span>
                        {file.pageCount && <span>📄 {file.pageCount} pages</span>}
                        {file.wordCount && <span>📝 {file.wordCount.toLocaleString()} words</span>}
                        <span>📅 {formatDate(file.uploadDate)}</span>
                      </div>
                      
                      {file.summary && (
                        <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border">
                          <strong>Summary:</strong> {file.summary}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                      ✅ {file.status}
                    </span>
                    
                    <Button size="sm" variant="outline">
                      📄 View
                    </Button>
                    
                    <Button size="sm" variant="ghost">
                      📤 Share
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="danger"
                      onClick={() => deleteFile(file.id)}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Quick Actions */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/chat" className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <span className="text-2xl mr-3">💬</span>
                <div>
                  <div className="font-medium text-gray-900">Ask Questions</div>
                  <div className="text-sm text-gray-600">Chat with your AI tutor</div>
                </div>
              </Link>
              
              <Link to="/study" className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <span className="text-2xl mr-3">🃏</span>
                <div>
                  <div className="font-medium text-gray-900">Create Flashcards</div>
                  <div className="text-sm text-gray-600">Generate study cards</div>
                </div>
              </Link>
              
              <Link to="/dashboard" className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <span className="text-2xl mr-3">📊</span>
                <div>
                  <div className="font-medium text-gray-900">View Progress</div>
                  <div className="text-sm text-gray-600">Track your learning</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {uploadedFiles.length === 0 && !processing && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No files uploaded yet
          </h3>
          <p className="text-gray-600 mb-6">
            Upload your first document to start building your knowledge base
          </p>
          <Button 
            variant="gradient"
            disabled={backendStatus !== 'connected'}
          >
            Upload Your First File
          </Button>
        </div>
      )}
    </div>
  );
};

export default UploadPage;