const mongoose = require('mongoose');

const podcastSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  audioFile: {
    filename: String,
    duration: Number,
    fileSize: Number
  },
  voiceType: {
    type: String,
    enum: ['ai', 'cloned'],
    required: true
  },
  voiceId: String, // AI voice ID or user voice sample ID
  generationStatus: {
    type: String,
    enum: ['pending', 'generating', 'completed', 'failed'],
    default: 'pending'
  },
  metadata: {
    wordCount: Number,
    estimatedDuration: Number,
    quality: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  errorMessage: String
}, {
  timestamps: true
});

module.exports = mongoose.models.Podcast || mongoose.model('Podcast', podcastSchema);