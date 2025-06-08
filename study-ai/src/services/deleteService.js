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
   * Clear the chat service cache - CRITICAL for fixing chatbot issue
   * @returns {Promise<boolean>} Success status
   */
  static async clearChatCache() {
    try {
      console.log('🧹 Clearing chat cache to prevent access to deleted files...');
      
      const response = await fetch(`${API_BASE_URL}/chat/clear-cache`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Chat cache cleared successfully:', result.message);
        return true;
      } else {
        const error = await response.json();
        console.warn('⚠️ Failed to clear chat cache:', error.message);
        return false;
      }
    } catch (error) {
      console.warn('⚠️ Error clearing chat cache:', error.message);
      return false;
    }
  }

  /**
   * Check chat context status (for verification)
   * @returns {Promise<Object|null>} Context status
   */
  static async checkChatContextStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/context-status`);
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('📊 Chat context status:', {
          hasContent: result.status.hasContext,
          files: result.status.availableFiles,
          contextLength: result.status.contextLength
        });
        return result.status;
      } else {
        console.warn('Failed to check chat context status:', result.error);
        return null;
      }
    } catch (error) {
      console.warn('Error checking chat context status:', error.message);
      return null;
    }
  }

  /**
   * Delete specific document with chat cache invalidation
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

      const result = await response.json();
      
      // CRITICAL: Clear chat cache after successful deletion
      if (result.success) {
        console.log('🗑️ Document deleted, clearing chat cache...');
        await this.clearChatCache();
        
        // Wait a moment and verify
        setTimeout(async () => {
          await this.checkChatContextStatus();
        }, 1000);
      }

      return result;
    } catch (error) {
      console.error('Delete document error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete ALL documents with chat cache invalidation (nuclear option)
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

      const result = await response.json();
      
      // CRITICAL: Clear chat cache after successful deletion
      if (result.success) {
        console.log('🗑️ All documents deleted, clearing chat cache...');
        await this.clearChatCache();
        
        // Wait a moment and verify
        setTimeout(async () => {
          const status = await this.checkChatContextStatus();
          if (status && status.availableFiles === 0) {
            console.log('✅ Verification: Chat now has no access to deleted files');
          }
        }, 1000);
      }

      return result;
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
    const message = `Are you sure you want to delete "${document.name}"?\n\nThis action cannot be undone.\n\n⚠️ The chatbot will also lose access to this content.`;
    return window.confirm(message);
  }

  /**
   * Show confirmation dialog for deleting all documents
   * @param {number} totalFiles - Total number of files
   * @returns {boolean} User confirmation
   */
  static confirmDeleteAll(totalFiles) {
    const message = `⚠️ WARNING: This will permanently delete ALL ${totalFiles} uploaded files!\n\nThis includes:\n- Original documents\n- Extracted text\n- All processed data\n- Chat context will be cleared\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?`;
    
    if (!window.confirm(message)) {
      return false;
    }
    
    // Double confirmation for nuclear option
    const doubleConfirm = window.confirm(`🚨 FINAL CONFIRMATION 🚨\n\nYou are about to DELETE ALL ${totalFiles} files permanently.\n\nThe chatbot will lose ALL context.\n\nType "DELETE" in the next prompt to confirm.`);
    
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
      return `✅ Successfully deleted ${result.totalDeleted} files from ${result.foldersProcessed?.join(', ')} folders. Chat cache cleared.`;
    } else {
      // Single delete result
      return `✅ Successfully deleted "${result.documentId}" (${result.totalDeleted} files). Chat cache cleared.`;
    }
  }

  /**
   * Handle delete with confirmation, feedback, and cache invalidation
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
   * Bulk delete multiple documents with cache invalidation
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
    
    console.log(`🗑️ Starting bulk delete of ${documents.length} documents...`);
    
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
    
    // Final cache clear after bulk operations
    if (results.successful.length > 0) {
      console.log('🧹 Bulk delete completed, ensuring chat cache is cleared...');
      await this.clearChatCache();
    }
    
    return results;
  }

  /**
   * Quick delete all with minimal confirmation (for development)
   * @returns {Promise<Object>} Delete result
   */
  static async quickDeleteAll() {
    const confirmed = window.confirm('🧹 Quick delete all documents?\n\n(This is a dev shortcut - use with caution!)\n\nChat cache will be cleared.');
    
    if (confirmed) {
      return await this.deleteAllDocuments();
    }
    
    return { success: false, error: 'User cancelled' };
  }

  /**
   * Test function to manually clear chat cache
   * @returns {Promise<boolean>} Success status
   */
  static async testClearCache() {
    console.log('🧪 Testing manual cache clear...');
    const success = await this.clearChatCache();
    
    if (success) {
      await this.checkChatContextStatus();
    }
    
    return success;
  }
}

export default DeleteService;