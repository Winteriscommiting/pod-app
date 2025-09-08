const Document = require('../models/Document');
const documentProcessor = require('../services/documentProcessor');
const EfficientSummarizationService = require('../services/efficientSummarization');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Initialize the efficient summarization service
const summarizationService = new EfficientSummarizationService();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/documents');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
  }
});

exports.uploadDocument = [
  upload.single('document'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const fileType = path.extname(req.file.originalname).slice(1).toLowerCase();
      const filePath = req.file.path;

      // Process the document
      const result = await documentProcessor.processDocument(filePath, fileType);

      if (!result.success) {
        // Clean up uploaded file
        fs.unlinkSync(filePath);
        return res.status(400).json({ message: result.error });
      }

      // Save document info to database
      const document = new Document({
        userId: req.user.id,
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileType,
        fileSize: req.file.size,
        filePath: req.file.path,
        extractedText: result.text,
        wordCount: result.wordCount,
        processingStatus: 'completed',
        summarizationStatus: 'pending'
      });

      await document.save();

      // Start summarization in background
      setTimeout(async () => {
        await summarizeDocument(document._id);
      }, 100);

      res.json({
        success: true,
        message: 'Document uploaded and processed successfully',
        document: { _id: document._id }, // For backward compatibility
        data: {
          id: document._id,
          filename: req.file.filename,
          originalName: req.file.originalname,
          fileType,
          fileSize: req.file.size,
          wordCount: result.wordCount,
          textPreview: result.text.substring(0, 200) + '...',
          uploadedAt: document.createdAt,
          summarizationStatus: 'pending'
        }
      });

    } catch (error) {
      console.error('Upload document error:', error);
      
      // Clean up uploaded file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ message: 'Server error during document upload' });
    }
  }
];

// Test upload without authentication (for testing only)
exports.testUploadDocument = [
  upload.single('document'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const fileType = path.extname(req.file.originalname).slice(1).toLowerCase();
      const filePath = req.file.path;

      // Process the document
      const result = await documentProcessor.processDocument(filePath, fileType);

      if (!result.success) {
        // Clean up uploaded file
        fs.unlinkSync(filePath);
        return res.status(400).json({ message: result.error });
      }

      // Create a test user ID for demonstration
      const testUserId = new mongoose.Types.ObjectId();

      // Save document info to database
      const document = new Document({
        userId: testUserId, // Use test user ID
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileType,
        fileSize: req.file.size,
        filePath: req.file.path,
        extractedText: result.text,
        wordCount: result.wordCount,
        processingStatus: 'completed',
        summarizationStatus: 'pending'
      });

      await document.save();

      res.json({
        success: true,
        message: 'Document uploaded and processed successfully (TEST MODE)',
        document: { _id: document._id },
        data: {
          id: document._id,
          filename: req.file.filename,
          originalName: req.file.originalname,
          fileType,
          fileSize: req.file.size,
          wordCount: result.wordCount,
          textPreview: result.text.substring(0, 200) + '...',
          uploadedAt: document.createdAt,
          summarizationStatus: 'pending'
        }
      });

    } catch (error) {
      console.error('Test upload document error:', error);
      
      // Clean up uploaded file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ message: 'Server error during document upload' });
    }
  }
];

exports.getDocuments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const fileType = req.query.fileType || '';
    
    // Build query
    let query = { userId: req.user.id };
    
    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { extractedText: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (fileType) {
      query.fileType = fileType;
    }
    
    // Get total count for pagination
    const total = await Document.countDocuments(query);
    
    // Get documents with pagination
    const documents = await Document.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .select('-extractedText'); // Exclude full text for performance
    
    res.json({
      success: true,
      documents: documents, // Frontend expects 'documents' not 'data'
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Delete file from filesystem
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }
    
    // Delete from database
    await Document.deleteOne({ _id: req.params.id });
    
    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDocumentById = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateDocument = async (req, res) => {
  try {
    const { title, tags } = req.body;
    
    const document = await Document.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { 
        title: title || undefined,
        tags: tags || undefined,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    res.json({
      success: true,
      message: 'Document updated successfully',
      data: document
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Background function to summarize documents
async function summarizeDocument(documentId) {
  try {
    const document = await Document.findById(documentId);
    if (!document) {
      console.error('Document not found for summarization:', documentId);
      return;
    }

    // Update status to processing
    document.summarizationStatus = 'processing';
    await document.save();

    console.log(`Starting efficient summarization for document: ${document.originalName}`);
    const startTime = Date.now();

    // Perform efficient summarization
    const result = await summarizationService.summarizeText(document.extractedText, {
      maxLength: 400,
      maxSentences: 5
    });

    // Get text statistics
    const textStats = summarizationService.getTextStats(document.extractedText);

    if (result.success) {
      // Update document with summarization results
      document.summary = result.summary;
      document.wordCount = textStats.wordCount;
      document.readingTime = textStats.readingTime;
      document.compressionRatio = Math.round(result.compressionRatio * 100);
      document.summarizationMethod = result.method;
      document.summarizationStatus = 'completed';
      document.summarizationError = '';
      document.processingTime = result.processingTime;
      
      console.log(`✅ Summarization completed in ${result.processingTime}ms using ${result.method} method`);
      console.log(`📊 Compression: ${document.compressionRatio}%, Reading time: ${document.readingTime}min`);
    } else {
      // Handle summarization failure
      document.summary = result.summary || 'Failed to generate summary';
      document.wordCount = textStats.wordCount;
      document.readingTime = textStats.readingTime;
      document.summarizationStatus = 'failed';
      document.summarizationError = result.error || 'Summarization failed';
      
      console.error(`❌ Summarization failed for ${document.originalName}:`, result.error);
    }

    await document.save();

  } catch (error) {
    console.error('Error during document summarization:', error);
    
    // Update document with error status
    try {
      await Document.findByIdAndUpdate(documentId, {
        summarizationStatus: 'failed',
        summarizationError: error.message
      });
    } catch (updateError) {
      console.error('Failed to update document with error status:', updateError);
    }
  }
}

// Get document summary
exports.getDocumentSummary = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).select('summary keywords readingTimeMinutes compressionRatio summarizationModel summarizationStatus summarizationError originalName wordCount');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json({
      success: true,
      data: {
        id: document._id,
        originalName: document.originalName,
        summary: document.summary,
        keywords: document.keywords,
        readingTimeMinutes: document.readingTimeMinutes,
        compressionRatio: document.compressionRatio,
        wordCount: document.wordCount,
        model: document.summarizationModel,
        status: document.summarizationStatus,
        error: document.summarizationError
      }
    });

  } catch (error) {
    console.error('Get document summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Regenerate document summary
exports.regenerateSummary = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Reset summarization status
    document.summarizationStatus = 'pending';
    document.summarizationError = '';
    await document.save();

    // Start summarization in background
    setTimeout(async () => {
      await summarizeDocument(document._id);
    }, 100);

    res.json({
      success: true,
      message: 'Summary regeneration started',
      data: {
        id: document._id,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Regenerate summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.summarizeDocumentManually = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (!document.extractedText || document.extractedText.trim() === '') {
      return res.status(400).json({ message: 'Document has no content to summarize' });
    }

    // Update status to processing
    document.summarizationStatus = 'processing';
    await document.save();

    // Perform summarization immediately
    const result = await summarizationService.summarizeText(document.extractedText, {
      maxLength: 400,
      maxSentences: 5
    });

    const textStats = summarizationService.getTextStats(document.extractedText);

    if (result.success) {
      // Update document with results
      document.summary = result.summary;
      document.wordCount = textStats.wordCount;
      document.readingTime = textStats.readingTime;
      document.compressionRatio = Math.round(result.compressionRatio * 100);
      document.summarizationMethod = result.method;
      document.summarizationStatus = 'completed';
      document.summarizationError = '';
      document.processingTime = result.processingTime;

      await document.save();

      res.json({
        success: true,
        message: 'Document summarized successfully',
        data: {
          id: document._id,
          summary: document.summary,
          compressionRatio: document.compressionRatio,
          readingTime: document.readingTime,
          method: document.summarizationMethod,
          processingTime: document.processingTime
        }
      });
    } else {
      document.summarizationStatus = 'failed';
      document.summarizationError = result.error || 'Summarization failed';
      await document.save();

      res.status(500).json({
        success: false,
        message: 'Summarization failed',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Manual summarization error:', error);
    res.status(500).json({ message: 'Server error during summarization' });
  }
};

// Get all documents with summaries (for summaries page)
exports.getDocumentsWithSummaries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status; // 'completed', 'pending', 'failed'
    
    // Build query
    let query = { userId: req.user.id };
    
    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      if (status === 'completed') {
        query.summarizationStatus = 'completed';
        query.summary = { $exists: true, $ne: '' };
      } else if (status === 'pending') {
        query.summarizationStatus = { $in: ['pending', 'processing'] };
      } else if (status === 'failed') {
        query.summarizationStatus = 'failed';
      }
    }
    
    // Get total count for pagination
    const total = await Document.countDocuments(query);
    
    // Get documents with pagination
    const documents = await Document.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .select('-extractedText'); // Exclude full text for performance

    // Calculate statistics
    const allDocs = await Document.find({ userId: req.user.id });
    const stats = {
      totalDocuments: allDocs.length,
      summarizedCount: allDocs.filter(doc => doc.summarizationStatus === 'completed' && doc.summary).length,
      avgCompressionRatio: Math.round(
        allDocs
          .filter(doc => doc.compressionRatio > 0)
          .reduce((sum, doc) => sum + doc.compressionRatio, 0) / 
        Math.max(1, allDocs.filter(doc => doc.compressionRatio > 0).length)
      ),
      totalReadingTime: allDocs.reduce((sum, doc) => sum + (doc.readingTime || 0), 0)
    };
    
    res.json({
      success: true,
      data: documents,
      stats: stats,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get documents with summaries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get summarization statistics
exports.getSummarizationStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const stats = await Document.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalDocuments: { $sum: 1 },
          summarizedDocuments: {
            $sum: { $cond: [{ $eq: ['$summarizationStatus', 'completed'] }, 1, 0] }
          },
          pendingDocuments: {
            $sum: { $cond: [{ $eq: ['$summarizationStatus', 'pending'] }, 1, 0] }
          },
          processingDocuments: {
            $sum: { $cond: [{ $eq: ['$summarizationStatus', 'processing'] }, 1, 0] }
          },
          failedDocuments: {
            $sum: { $cond: [{ $eq: ['$summarizationStatus', 'failed'] }, 1, 0] }
          },
          totalWordCount: { $sum: '$wordCount' },
          averageCompressionRatio: { $avg: '$compressionRatio' },
          totalReadingTime: { $sum: '$readingTimeMinutes' }
        }
      }
    ]);

    const result = stats[0] || {
      totalDocuments: 0,
      summarizedDocuments: 0,
      pendingDocuments: 0,
      processingDocuments: 0,
      failedDocuments: 0,
      totalWordCount: 0,
      averageCompressionRatio: 0,
      totalReadingTime: 0
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get summarization stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete the physical file if it exists
    const fs = require('fs');
    if (document.filePath && fs.existsSync(document.filePath)) {
      try {
        fs.unlinkSync(document.filePath);
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete the document from database
    await Document.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Server error during document deletion' });
  }
};
