const Document = require('../models/Document');
const documentProcessor = require('../services/documentProcessor');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
        status: 'processed'
      });

      await document.save();

      res.json({
        success: true,
        message: 'Document uploaded and processed successfully',
        data: {
          id: document._id,
          filename: req.file.filename,
          originalName: req.file.originalname,
          fileType,
          fileSize: req.file.size,
          wordCount: result.wordCount,
          textPreview: result.text.substring(0, 200) + '...',
          uploadedAt: document.createdAt
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
      data: documents,
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
