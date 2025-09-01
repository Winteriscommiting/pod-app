const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'docx', 'txt'],
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  extractedText: {
    type: String,
    required: true
  },
  wordCount: {
    type: Number,
    required: true
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'completed'
  },
  // Summarization fields
  summary: {
    type: String,
    default: ''
  },
  keywords: [{
    type: String
  }],
  readingTimeMinutes: {
    type: Number,
    default: 0
  },
  compressionRatio: {
    type: Number,
    default: 0
  },
  summarizationModel: {
    type: String,
    default: ''
  },
  summarizationStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  summarizationError: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for better search performance
documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ originalName: 'text', extractedText: 'text' });

module.exports = mongoose.models.Document || mongoose.model('Document', documentSchema);