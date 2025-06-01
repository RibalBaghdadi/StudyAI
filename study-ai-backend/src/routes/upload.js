const express = require('express');
const router = express.Router();
const UploadController = require('../controllers/uploadController');
const { upload, handleMulterErrors, cleanupFiles } = require('../middleware/fileHandler');

// Upload multiple files
router.post('/files', upload.array('files', 10), handleMulterErrors, async (req, res) => {
  try {
    await UploadController.uploadFiles(req, res);
  } catch (error) {
    // Cleanup uploaded files on error
    cleanupFiles(req.files);
    throw error;
  }
});

// Upload single file
router.post('/file', upload.single('file'), handleMulterErrors, async (req, res) => {
  try {
    // Convert single file to array for consistent processing
    req.files = req.file ? [req.file] : [];
    await UploadController.uploadFiles(req, res);
  } catch (error) {
    // Cleanup uploaded file on error
    if (req.file) cleanupFiles([req.file]);
    throw error;
  }
});

// Get list of uploaded files
router.get('/files', UploadController.getUploadedFiles);

// Delete uploaded file
router.delete('/files/:fileId', UploadController.deleteFile);

// Get file info by ID
router.get('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // This would typically query a database
    res.json({
      message: `Get file info for ${fileId} - will be implemented with database`
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get file info',
      message: error.message
    });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    message: 'Upload routes are working!',
    timestamp: new Date().toISOString(),
    uploadPath: process.env.UPLOAD_PATH
  });
});

module.exports = router;