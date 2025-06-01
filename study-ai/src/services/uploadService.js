// src/services/uploadService.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class UploadService {
  /**
   * Upload multiple files to the backend
   * @param {File[]} files - Array of files to upload
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<Object>} Upload response
   */
  static async uploadFiles(files, onProgress = null) {
    try {
      const formData = new FormData();
      
      // Append all files to FormData
      files.forEach((file, index) => {
        formData.append('files', file);
      });

      const response = await fetch(`${API_BASE_URL}/upload/files`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Upload failed:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Upload files with progress tracking using XMLHttpRequest
   * @param {File[]} files - Array of files to upload
   * @param {Function} onProgress - Progress callback (0-100)
   * @returns {Promise<Object>} Upload response
   */
  static async uploadFilesWithProgress(files, onProgress = null) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      const xhr = new XMLHttpRequest();

      // Progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        });
      }

      // Handle response
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.message || `HTTP ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was aborted'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timed out'));
      });

      // Configure and send request
      xhr.open('POST', `${API_BASE_URL}/upload/files`);
      xhr.timeout = 5 * 60 * 1000; // 5 minutes timeout
      xhr.send(formData);
    });
  }

  /**
   * Get list of uploaded files
   * @returns {Promise<Object>} Files list
   */
  static async getUploadedFiles() {
    try {
      const response = await fetch(`${API_BASE_URL}/upload/files`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch files:', error);
      throw error;
    }
  }

  /**
   * Delete an uploaded file
   * @param {string} fileId - ID of the file to delete
   * @returns {Promise<Object>} Delete response
   */
  static async deleteFile(fileId) {
    try {
      const response = await fetch(`${API_BASE_URL}/upload/files/${fileId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  /**
   * Check backend health
   * @returns {Promise<Object>} Health status
   */
  static async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * Validate file before upload
   * @param {File} file - File to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  static validateFile(file, options = {}) {
    const {
      maxSize = 50 * 1024 * 1024, // 50MB
      allowedTypes = ['.pdf', '.txt', '.doc', '.docx', '.ppt', '.pptx', '.mp3', '.wav', '.m4a']
    } = options;

    const errors = [];

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File "${file.name}" is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`);
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      errors.push(`File type "${fileExtension}" is not supported. Allowed types: ${allowedTypes.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted size
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default UploadService;