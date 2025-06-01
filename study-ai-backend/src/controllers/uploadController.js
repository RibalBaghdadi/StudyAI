const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

class UploadController {
  // Upload files endpoint
  static async uploadFiles(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: 'No files uploaded',
          message: 'Please select at least one file to upload'
        });
      }

      const processedFiles = [];

      for (const file of req.files) {
        try {
          // Process each file
          const fileInfo = await UploadController.processFile(file);
          processedFiles.push(fileInfo);
        } catch (error) {
          console.error(`Error processing file ${file.originalname}:`, error);
          processedFiles.push({
            id: Date.now() + Math.random(),
            name: file.originalname,
            status: 'error',
            error: error.message,
            size: file.size,
            uploadDate: new Date().toISOString()
          });
        }
      }

      res.json({
        message: 'Files uploaded successfully',
        files: processedFiles,
        total: processedFiles.length,
        successful: processedFiles.filter(f => f.status === 'processed').length,
        failed: processedFiles.filter(f => f.status === 'error').length
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        error: 'Upload failed',
        message: error.message
      });
    }
  }

  // Process individual file
  static async processFile(file) {
    const fileId = Date.now() + '_' + Math.random().toString(36).substring(2);
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    let extractedText = '';
    let pageCount = 0;
    let wordCount = 0;

    try {
      // Read file buffer
      let fileBuffer;
      if (file.buffer) {
        // If buffer is already available (memory storage)
        fileBuffer = file.buffer;
      } else {
        // If file is saved to disk (disk storage), read it
        fileBuffer = await fs.readFile(file.path);
      }

      // Extract text based on file type
      switch (fileExtension) {
        case '.pdf':
          const pdfResult = await UploadController.extractFromPDF(fileBuffer);
          extractedText = pdfResult.text;
          pageCount = pdfResult.numpages || 1;
          break;
          
        case '.docx':
          const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
          extractedText = docxResult.value;
          pageCount = Math.ceil(extractedText.length / 3000); // Estimate pages
          break;
          
        case '.txt':
          extractedText = fileBuffer.toString('utf-8');
          pageCount = Math.ceil(extractedText.length / 3000);
          break;
          
        case '.mp3':
        case '.wav':
        case '.m4a':
          // Audio files - will be processed later with Whisper
          extractedText = '[Audio file - transcription pending]';
          pageCount = 1;
          break;
          
        default:
          throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      // Calculate word count
      wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;

      // Save extracted text
      if (extractedText && extractedText !== '[Audio file - transcription pending]') {
        const textFileName = `${fileId}_extracted.txt`;
        const textFilePath = path.join(process.env.UPLOAD_PATH, 'extracted-text', textFileName);
        await fs.writeFile(textFilePath, extractedText, 'utf-8');
      }

      // Generate summary (placeholder for now)
      const summary = UploadController.generateBasicSummary(extractedText);

      return {
        id: fileId,
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        status: 'processed',
        uploadDate: new Date().toISOString(),
        extractedText: extractedText.substring(0, 500) + '...', // First 500 chars for preview
        summary: summary,
        pageCount: pageCount,
        wordCount: wordCount,
        filePath: file.path
      };

    } catch (error) {
      throw new Error(`Failed to process ${file.originalname}: ${error.message}`);
    }
  }

  // Extract text from PDF - FIXED VERSION
  static async extractFromPDF(buffer) {
    try {
      // Ensure buffer is a proper Buffer object
      if (!Buffer.isBuffer(buffer)) {
        throw new Error('Invalid buffer provided to PDF parser');
      }

      console.log('Processing PDF buffer, size:', buffer.length);
      
      const data = await pdfParse(buffer);
      
      console.log('PDF parsed successfully, pages:', data.numpages, 'text length:', data.text.length);
      
      return {
        text: data.text,
        numpages: data.numpages
      };
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  // Generate basic summary (will be replaced with AI later)
  static generateBasicSummary(text) {
    if (!text || text.length < 100) {
      return 'Document is too short to generate a meaningful summary.';
    }

    // Extract first meaningful sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const firstSentences = sentences.slice(0, 3).join('. ');
    
    return firstSentences.length > 200 
      ? firstSentences.substring(0, 200) + '...'
      : firstSentences + '.';
  }

  // Get uploaded files list
  static async getUploadedFiles(req, res) {
    try {
      // This would typically query a database
      // For now, return mock data
      res.json({
        files: [],
        message: 'Files list endpoint - will be implemented with database'
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch files',
        message: error.message
      });
    }
  }

  // Delete uploaded file
  static async deleteFile(req, res) {
    try {
      const { fileId } = req.params;
      
      // Implementation will depend on your storage strategy
      res.json({
        message: `Delete file ${fileId} - will be implemented with database`
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to delete file',
        message: error.message
      });
    }
  }
}

module.exports = UploadController;