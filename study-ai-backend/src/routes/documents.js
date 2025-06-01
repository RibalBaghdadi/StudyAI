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
      'DELETE /api/documents/:id - Delete specific document',
      'DELETE /api/documents/ - Delete ALL documents (WARNING!)'
    ]
  });
});

module.exports = router;