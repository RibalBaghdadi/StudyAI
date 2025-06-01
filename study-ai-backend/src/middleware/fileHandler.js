const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Initialize upload directories
const uploadPath = process.env.UPLOAD_PATH || './uploads';
ensureDirectoryExists(path.join(uploadPath, 'documents'));
ensureDirectoryExists(path.join(uploadPath, 'audio'));
ensureDirectoryExists(path.join(uploadPath, 'extracted-text'));

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    // Determine subdirectory based on file type
    let subDir = 'documents';
    if (['.mp3', '.wav', '.m4a'].includes(fileExtension)) {
      subDir = 'audio';
    }
    
    const destinationPath = path.join(uploadPath, subDir);
    ensureDirectoryExists(destinationPath);
    cb(null, destinationPath);
  },
  
  filename: (req, file, cb) => {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const fileExtension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, fileExtension)
      .replace(/[^a-zA-Z0-9]/g, '_') // Replace special chars with underscore
      .substring(0, 50); // Limit length
    
    const fileName = `${timestamp}_${randomString}_${baseName}${fileExtension}`;
    cb(null, fileName);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedExtensions = [
    '.pdf', '.txt', '.doc', '.docx', '.ppt', '.pptx',
    '.mp3', '.wav', '.m4a'
  ];
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${fileExtension} is not supported. Allowed types: ${allowedExtensions.join(', ')}`), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB default
    files: 10 // Maximum 10 files per upload
  }
});

// Error handling middleware for multer
const handleMulterErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: 'File too large',
          message: `File size must be less than ${process.env.MAX_FILE_SIZE || '50MB'}`
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: 'Too many files',
          message: 'Maximum 10 files allowed per upload'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: 'Unexpected file field',
          message: 'Invalid file field name'
        });
      default:
        return res.status(400).json({
          error: 'Upload error',
          message: error.message
        });
    }
  }
  
  if (error.message.includes('File type')) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: error.message
    });
  }
  
  // Pass other errors to global error handler
  next(error);
};

// Cleanup function for uploaded files (in case of processing errors)
const cleanupFiles = (files) => {
  if (!files) return;
  
  files.forEach(file => {
    if (file.path && fs.existsSync(file.path)) {
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error cleaning up file:', file.path, err);
      });
    }
  });
};

module.exports = {
  upload,
  handleMulterErrors,
  cleanupFiles
};