import React, { useState, useRef } from 'react';
import Button from './Button';

const FileDropZone = ({ 
  onFileUpload, 
  acceptedTypes = ".pdf,.txt,.mp3,.wav,.m4a,.docx,.pptx", 
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  children,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const validateFile = (file) => {
    // Check file size
    if (file.size > maxSize) {
      return `File "${file.name}" is too large. Maximum size is ${maxSize / 1024 / 1024}MB.`;
    }
    
    // Check file type
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    const allowedTypes = acceptedTypes.split(',').map(type => type.trim().toLowerCase());
    
    if (!allowedTypes.includes(fileExtension)) {
      return `File type "${fileExtension}" is not supported.`;
    }
    
    return null;
  };
  
  const handleFiles = async (files) => {
    const fileArray = Array.from(files);
    
    // Check max files limit
    if (fileArray.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} files at once.`);
      return;
    }
    
    // Validate each file
    const errors = [];
    const validFiles = [];
    
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });
    
    // Show errors if any
    if (errors.length > 0) {
      alert(errors.join('\n'));
    }
    
    // Process valid files
    if (validFiles.length > 0) {
      setIsUploading(true);
      try {
        await onFileUpload(validFiles);
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Upload failed. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    handleFiles(files);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  const handleFileSelect = (e) => {
    const files = e.target.files;
    handleFiles(files);
    // Reset input value to allow same file selection
    e.target.value = '';
  };
  
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };
  
  const getAcceptedTypesDisplay = () => {
    return acceptedTypes.split(',').map(type => type.trim().toUpperCase()).join(', ');
  };
  
  return (
    <div className={`w-full ${className}`}>
      <div
        className={`
          file-drop-zone border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${isDragOver ? 'border-blue-500 bg-blue-50 border-solid' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
        
        {isUploading ? (
          <div className="space-y-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-lg font-medium text-blue-600">Uploading files...</p>
          </div>
        ) : children ? (
          children
        ) : (
          <div className="space-y-4">
            <div className="file-upload-icon">📁</div>
            <div>
              <p className="text-xl font-semibold text-gray-700 mb-2">
                Drop files here or click to upload
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supported formats: {getAcceptedTypesDisplay()}
              </p>
              <p className="text-xs text-gray-400">
                Maximum {maxFiles} files, up to {maxSize / 1024 / 1024}MB each
              </p>
            </div>
            <Button variant="outline" className="mt-4">
              Choose Files
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileDropZone;