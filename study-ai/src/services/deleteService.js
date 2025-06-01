// src/services/deleteService.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class DeleteService {
  /**
   * Get information about what will be deleted
   * @returns {Promise<Object>} Deletion info
   */
  static async getDeleteInfo() {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/delete/info`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get delete info error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete specific document
   * @param {string} documentId - Document ID to delete
   * @returns {Promise<Object>} Delete result
   */
  static async deleteDocument(documentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Delete document error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete ALL documents (nuclear option)
   * @returns {Promise<Object>} Delete result
   */
  static async deleteAllDocuments() {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Delete all documents error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Show confirmation dialog for single document deletion
   * @param {Object} document - Document to delete
   * @returns {boolean} User confirmation
   */
  static confirmSingleDelete(document) {
    const message = `Are you sure you want to delete "${document.name}"?\n\nThis action cannot be undone.`;
    return window.confirm(message);
  }

  /**
   * Show confirmation dialog for deleting all documents
   * @param {number} totalFiles - Total number of files
   * @returns {boolean} User confirmation
   */
  static confirmDeleteAll(totalFiles) {
    const message = `⚠️ WARNING: This will permanently delete ALL ${totalFiles} uploaded files!\n\nThis includes:\n- Original documents\n- Extracted text\n- All processed data\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?`;
    
    if (!window.confirm(message)) {
      return false;
    }
    
    // Double confirmation for nuclear option
    const doubleConfirm = window.confirm(`🚨 FINAL CONFIRMATION 🚨\n\nYou are about to DELETE ALL ${totalFiles} files permanently.\n\nType "DELETE" in the next prompt to confirm.`);
    
    if (doubleConfirm) {
      const typeConfirm = window.prompt('Type "DELETE" (in caps) to confirm:');
      return typeConfirm === 'DELETE';
    }
    
    return false;
  }

  /**
   * Format delete result for display
   * @param {Object} result - Delete result from API
   * @returns {string} Formatted message
   */
  static formatDeleteResult(result) {
    if (!result.success) {
      return `❌ Delete failed: ${result.error}`;
    }
    
    if (result.totalDeleted !== undefined) {
      // Delete all result
      return `✅ Successfully deleted ${result.totalDeleted} files from ${result.foldersProcessed?.join(', ')} folders`;
    } else {
      // Single delete result
      return `✅ Successfully deleted "${result.documentId}" (${result.totalDeleted} files)`;
    }
  }

  /**
   * Handle delete with confirmation and feedback
   * @param {Object} document - Document to delete (null for delete all)
   * @param {Function} onSuccess - Success callback
   * @param {Function} onError - Error callback
   */
  static async handleDelete(document, onSuccess, onError) {
    try {
      let confirmed = false;
      let result = null;
      
      if (document) {
        // Single document delete
        confirmed = this.confirmSingleDelete(document);
        if (confirmed) {
          result = await this.deleteDocument(document.id);
        }
      } else {
        // Delete all documents
        const info = await this.getDeleteInfo();
        if (info.success && info.totalFiles > 0) {
          confirmed = this.confirmDeleteAll(info.totalFiles);
          if (confirmed) {
            result = await this.deleteAllDocuments();
          }
        } else if (info.success && info.totalFiles === 0) {
          onError?.('No documents to delete');
          return;
        } else {
          onError?.('Failed to get delete information');
          return;
        }
      }
      
      if (!confirmed) {
        return; // User cancelled
      }
      
      if (result?.success) {
        const message = this.formatDeleteResult(result);
        onSuccess?.(message, result);
      } else {
        const errorMsg = result?.error || 'Delete operation failed';
        onError?.(errorMsg);
      }
      
    } catch (error) {
      console.error('Handle delete error:', error);
      onError?.(error.message);
    }
  }

  /**
   * Bulk delete multiple documents
   * @param {Array} documents - Array of documents to delete
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Bulk delete result
   */
  static async bulkDeleteDocuments(documents, onProgress) {
    const results = {
      successful: [],
      failed: [],
      total: documents.length
    };
    
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      onProgress?.(i + 1, documents.length, doc.name);
      
      try {
        const result = await this.deleteDocument(doc.id);
        if (result.success) {
          results.successful.push({ document: doc, result });
        } else {
          results.failed.push({ document: doc, error: result.error });
        }
      } catch (error) {
        results.failed.push({ document: doc, error: error.message });
      }
      
      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  /**
   * Quick delete all with minimal confirmation (for development)
   * @returns {Promise<Object>} Delete result
   */
  static async quickDeleteAll() {
    const confirmed = window.confirm('🧹 Quick delete all documents?\n\n(This is a dev shortcut - use with caution!)');
    
    if (confirmed) {
      return await this.deleteAllDocuments();
    }
    
    return { success: false, error: 'User cancelled' };
  }
}

export default DeleteService;