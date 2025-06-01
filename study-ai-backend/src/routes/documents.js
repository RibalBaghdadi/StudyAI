const express = require('express');
const router = express.Router();
const DocumentsController = require('../controllers/documentsController');

// Get list of all uploaded documents
router.get('/list', DocumentsController.getDocumentsList);

// Get specific document content
router.get('/:documentId/content', DocumentsController.getDocumentContent);

// Get document summary
router.get('/:documentId/summary', DocumentsController.getDocumentSummary);

// Get document context for chat
router.get('/:documentId/context', DocumentsController.getDocumentContext);

// Get delete information (how many files will be deleted)
router.get('/delete/info', DocumentsController.getDeleteInfo);

// Bulk delete multiple documents
router.delete('/bulk-delete', async (req, res) => {
  try {
    const { documentIds } = req.body;
    
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'documentIds array is required'
      });
    }

    const results = {
      successful: [],
      failed: [],
      total: documentIds.length
    };

    // Process each document deletion
    for (const documentId of documentIds) {
      try {
        // Create a mock request object for the controller
        const mockReq = { params: { documentId } };
        let deleteResult = null;
        
        // Create a mock response object to capture the result
        const mockRes = {
          json: (data) => { deleteResult = data; },
          status: (code) => ({ json: (data) => { deleteResult = { ...data, statusCode: code }; } })
        };

        await DocumentsController.deleteDocument(mockReq, mockRes);
        
        if (deleteResult && deleteResult.success) {
          results.successful.push({
            documentId,
            result: deleteResult
          });
        } else {
          results.failed.push({
            documentId,
            error: deleteResult?.error || 'Delete failed'
          });
        }
      } catch (error) {
        results.failed.push({
          documentId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Bulk delete completed: ${results.successful.length} successful, ${results.failed.length} failed`,
      results: results,
      totalProcessed: results.total,
      successfulCount: results.successful.length,
      failedCount: results.failed.length
    });

  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Bulk delete failed',
      message: error.message
    });
  }
});

// Delete specific document
router.delete('/:documentId', DocumentsController.deleteDocument);

// Delete ALL documents (nuclear option) - WARNING: Destructive!
router.delete('/', DocumentsController.deleteAllDocuments);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    message: 'Documents routes are working!',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /api/documents/list - Get all documents',
      'GET /api/documents/:id/content - Get document content',
      'GET /api/documents/:id/summary - Get document summary',
      'GET /api/documents/:id/context - Get document context for chat',
      'GET /api/documents/delete/info - Get deletion info',
      'DELETE /api/documents/bulk-delete - Bulk delete documents',
      'DELETE /api/documents/:id - Delete specific document',
      'DELETE /api/documents/ - Delete ALL documents (WARNING!)'
    ]
  });
});

module.exports = router;