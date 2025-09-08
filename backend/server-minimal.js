// Working server with real authentication
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Robust MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb+srv://podcastapp-user:SecurePass123!@podcast-app-cluster.lcsqxxf.mongodb.net/podcast-app',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('✅ Connected to MongoDB Atlas');
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // Don't exit, continue with app startup
    return null;
  }
};

// Connect to database
connectDB();

// User schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// Document schema
const DocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  filename: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  content: { type: String },
  summary: { type: String },
  wordCount: { type: Number },
  readingTime: { type: Number },
  compressionRatio: { type: Number },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['uploaded', 'processing', 'processed', 'error'], 
    default: 'uploaded' 
  }
});

const Document = mongoose.model('Document', DocumentSchema);

// Podcast schema
const PodcastSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  audioUrl: { type: String },
  voiceType: { type: String, enum: ['ai', 'cloned'], default: 'ai' },
  voiceId: { type: String },
  duration: { type: Number },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'error'], 
    default: 'pending' 
  }
});

const Podcast = mongoose.model('Podcast', PodcastSchema);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'), false);
    }
  }
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key-for-testing', (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Text extraction helper functions
async function extractTextFromBuffer(buffer, fileExt) {
  try {
    switch (fileExt) {
      case '.txt':
        return buffer.toString('utf8');
      
      case '.pdf':
        const pdfData = await pdfParse(buffer);
        return pdfData.text;
      
      case '.docx':
        const docxResult = await mammoth.extractRawText({ buffer: buffer });
        return docxResult.value;
      
      default:
        throw new Error(`Unsupported file type: ${fileExt}`);
    }
  } catch (error) {
    console.error(`❌ Text extraction failed for ${fileExt}:`, error);
    throw new Error(`Failed to extract text from ${fileExt} file`);
  }
}

// Simple AI-style summarization (basic implementation)
function generateSummary(text) {
  try {
    // Clean and prepare text
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const words = cleanText.split(' ');
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    if (sentences.length === 0) {
      return {
        summary: 'No meaningful content found for summarization.',
        wordCount: words.length,
        readingTime: Math.ceil(words.length / 200), // Average reading speed
        compressionRatio: 0
      };
    }
    
    // Simple extractive summarization - take first, middle, and last meaningful sentences
    let summarySentences = [];
    
    if (sentences.length <= 3) {
      summarySentences = sentences;
    } else {
      // Take first sentence
      summarySentences.push(sentences[0].trim());
      
      // Take middle sentence(s)
      const middleIndex = Math.floor(sentences.length / 2);
      summarySentences.push(sentences[middleIndex].trim());
      
      // Take last sentence if different from others
      const lastSentence = sentences[sentences.length - 1].trim();
      if (!summarySentences.includes(lastSentence)) {
        summarySentences.push(lastSentence);
      }
    }
    
    const summary = summarySentences.join('. ') + '.';
    const summaryWordCount = summary.split(' ').length;
    const compressionRatio = Math.round((1 - summaryWordCount / words.length) * 100);
    
    return {
      summary: summary,
      wordCount: words.length,
      summaryWordCount: summaryWordCount,
      readingTime: Math.ceil(words.length / 200),
      compressionRatio: Math.max(0, compressionRatio)
    };
  } catch (error) {
    console.error('❌ Summary generation failed:', error);
    return {
      summary: 'Failed to generate summary.',
      wordCount: 0,
      readingTime: 0,
      compressionRatio: 0
    };
  }
}

// CORS middleware
app.use(cors({
  origin: '*',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check - simple and reliable
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    message: 'Pod App Backend Running'
  });
});

// Login endpoint with better error handling
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    // For test user, always create if not exists
    if (email === 'test@example.com' && password === 'password123') {
      let user = await User.findOne({ email }).catch(() => null);
      
      if (!user) {
        try {
          const hashedPassword = await bcrypt.hash('password123', 10);
          user = new User({
            username: 'testuser',
            email: 'test@example.com',
            password: hashedPassword
          });
          await user.save();
          console.log('✅ Created test user');
        } catch (createError) {
          console.log('Test user might already exist:', createError.message);
          user = await User.findOne({ email }).catch(() => null);
        }
      }
      
      if (user) {
        const token = jwt.sign(
          { id: user._id }, 
          process.env.JWT_SECRET || 'fallback-secret-key-for-testing', 
          { expiresIn: '30d' }
        );
        
        return res.json({
          success: true,
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email
          }
        });
      }
    }
    
    // Regular login flow
    const user = await User.findOne({ email }).catch(() => null);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'fallback-secret-key-for-testing', 
      { expiresIn: '30d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error occurred' 
    });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }
    
    const existingUser = await User.findOne({ email }).catch(() => null);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      username,
      email,
      password: hashedPassword
    });
    
    await user.save();
    
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'fallback-secret-key-for-testing', 
      { expiresIn: '30d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error occurred' 
    });
  }
});

// Document upload endpoint
app.post('/api/documents/upload', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    console.log('📤 Document upload request received');
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    console.log('📄 File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Extract text content based on file type
    let content = '';
    let extractionStatus = 'uploaded';
    
    try {
      console.log('🔍 Extracting text from file...');
      content = await extractTextFromBuffer(req.file.buffer, fileExt);
      extractionStatus = 'processed';
      console.log('✅ Text extraction successful, length:', content.length);
    } catch (extractionError) {
      console.error('❌ Text extraction failed:', extractionError);
      content = `[Text extraction failed: ${extractionError.message}]`;
      extractionStatus = 'error';
    }

    const document = new Document({
      title: req.file.originalname,
      filename: req.file.originalname,
      fileType: fileExt,
      fileSize: req.file.size,
      content: content,
      userId: req.user.id,
      status: extractionStatus
    });

    await document.save();
    console.log('✅ Document saved to database');

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        id: document._id,
        title: document.title,
        fileType: document.fileType,
        fileSize: document.fileSize,
        status: document.status,
        uploadedAt: document.uploadedAt
      }
    });
  } catch (error) {
    console.error('❌ Document upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Upload failed' 
    });
  }
});

// Get user documents
app.get('/api/documents', authenticateToken, async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user.id })
      .sort({ uploadedAt: -1 })
      .select('-content'); // Exclude content for list view

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('❌ Error fetching documents:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
});

// Get single document
app.get('/api/documents/:id', authenticateToken, async (req, res) => {
  try {
    const document = await Document.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('❌ Error fetching document:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch document' });
  }
});

// Summarize document endpoint
app.post('/api/documents/:id/summarize', authenticateToken, async (req, res) => {
  try {
    const document = await Document.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (!document.content || document.content.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Document has no content to summarize' 
      });
    }

    console.log('📝 Generating summary for document:', document.title);
    
    // Generate summary
    const summaryData = generateSummary(document.content);
    
    // Update document with summary
    document.summary = summaryData.summary;
    document.wordCount = summaryData.wordCount;
    document.readingTime = summaryData.readingTime;
    document.compressionRatio = summaryData.compressionRatio;
    await document.save();

    console.log('✅ Summary generated and saved');

    res.json({
      success: true,
      message: 'Document summarized successfully',
      data: {
        id: document._id,
        summary: summaryData.summary,
        wordCount: summaryData.wordCount,
        summaryWordCount: summaryData.summaryWordCount,
        readingTime: summaryData.readingTime,
        compressionRatio: summaryData.compressionRatio
      }
    });
  } catch (error) {
    console.error('❌ Summarization error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Summarization failed' 
    });
  }
});

// Get document summaries with stats
app.get('/api/summaries', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    
    let filter = { userId: req.user.id };
    if (status === 'completed') {
      filter.summarizationStatus = 'completed';
      filter.summary = { $exists: true, $ne: '' };
    } else if (status === 'pending') {
      filter.summarizationStatus = { $in: ['pending', 'processing'] };
    } else if (status === 'failed') {
      filter.summarizationStatus = 'failed';
    }

    const documents = await Document.find(filter)
      .sort({ createdAt: -1 })
      .select('originalName filename fileType fileSize summary wordCount readingTime compressionRatio summarizationStatus createdAt processingTime summarizationMethod');

    // Calculate stats
    const allDocs = await Document.find({ userId: req.user.id });
    const summarizedDocs = allDocs.filter(doc => doc.summarizationStatus === 'completed' && doc.summary);
    
    const stats = {
      totalDocuments: allDocs.length,
      summarizedCount: summarizedDocs.length,
      avgCompressionRatio: Math.round(
        summarizedDocs.length > 0 ? 
        summarizedDocs.reduce((sum, doc) => sum + (doc.compressionRatio || 0), 0) / summarizedDocs.length : 0
      ),
      totalReadingTime: allDocs.reduce((sum, doc) => sum + (doc.readingTime || 0), 0)
    };

    res.json({
      success: true,
      data: documents,
      stats: stats
    });
  } catch (error) {
    console.error('❌ Error fetching summaries:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch summaries' });
  }
});

// Auto-summarize all processed documents
app.post('/api/documents/auto-summarize', authenticateToken, async (req, res) => {
  try {
    const documents = await Document.find({ 
      userId: req.user.id,
      status: 'processed',
      summary: { $exists: false }
    });

    console.log(`📝 Auto-summarizing ${documents.length} documents...`);
    
    let successCount = 0;
    let errorCount = 0;

    for (const document of documents) {
      try {
        if (document.content && document.content.trim().length > 0) {
          const summaryData = generateSummary(document.content);
          
          document.summary = summaryData.summary;
          document.wordCount = summaryData.wordCount;
          document.readingTime = summaryData.readingTime;
          document.compressionRatio = summaryData.compressionRatio;
          await document.save();
          
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to summarize document ${document._id}:`, error);
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: `Auto-summarization completed`,
      data: {
        processed: successCount,
        failed: errorCount,
        total: documents.length
      }
    });
  } catch (error) {
    console.error('❌ Auto-summarization error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Auto-summarization failed' 
    });
  }
});

// Create podcast
app.post('/api/podcasts', authenticateToken, async (req, res) => {
  try {
    const { documentId, title, description, voiceType = 'ai', voiceId } = req.body;

    if (!documentId) {
      return res.status(400).json({ success: false, message: 'Document ID is required' });
    }

    // Verify document exists and belongs to user
    const document = await Document.findOne({ 
      _id: documentId, 
      userId: req.user.id 
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const podcast = new Podcast({
      title: title || `Podcast from ${document.title}`,
      description: description || `Generated podcast from ${document.title}`,
      documentId: documentId,
      voiceType: voiceType,
      voiceId: voiceId,
      userId: req.user.id,
      status: 'processing'
    });

    await podcast.save();

    // In a real implementation, you would trigger audio generation here
    // For now, we'll simulate processing
    setTimeout(async () => {
      try {
        podcast.status = 'completed';
        podcast.audioUrl = `/api/podcasts/${podcast._id}/audio`;
        podcast.duration = Math.floor(Math.random() * 1800) + 300; // Random 5-30 minutes
        await podcast.save();
        console.log(`✅ Podcast ${podcast._id} processing completed`);
      } catch (error) {
        console.error('❌ Podcast processing error:', error);
        podcast.status = 'error';
        await podcast.save();
      }
    }, 5000); // Simulate 5 second processing

    res.json({
      success: true,
      message: 'Podcast creation started',
      data: {
        id: podcast._id,
        title: podcast.title,
        status: podcast.status,
        createdAt: podcast.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Podcast creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create podcast' 
    });
  }
});

// Get user podcasts
app.get('/api/podcasts', authenticateToken, async (req, res) => {
  try {
    const podcasts = await Podcast.find({ userId: req.user.id })
      .populate('documentId', 'title filename')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: podcasts
    });
  } catch (error) {
    console.error('❌ Error fetching podcasts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch podcasts' });
  }
});

// Get single podcast
app.get('/api/podcasts/:id', authenticateToken, async (req, res) => {
  try {
    const podcast = await Podcast.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    }).populate('documentId', 'title filename content');

    if (!podcast) {
      return res.status(404).json({ success: false, message: 'Podcast not found' });
    }

    res.json({
      success: true,
      data: podcast
    });
  } catch (error) {
    console.error('❌ Error fetching podcast:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch podcast' });
  }
});

// Catch all other routes
app.get('*', (req, res) => {
  res.json({ 
    message: 'Pod App Backend API', 
    status: 'running',
    endpoints: [
      '/api/health', 
      '/api/auth/login', 
      '/api/auth/register',
      '/api/documents/upload',
      '/api/documents',
      '/api/documents/:id/summarize',
      '/api/summaries',
      '/api/documents/auto-summarize',
      '/api/podcasts'
    ]
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Health check: /api/health`);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received');
  server.close(() => {
    mongoose.connection.close();
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received');
  server.close(() => {
    mongoose.connection.close();
    console.log('✅ Server closed gracefully');  
    process.exit(0);
  });
});

module.exports = app;
