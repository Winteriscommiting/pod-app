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
  // Legacy fields for compatibility
  voiceType: String,
  voiceId: String,
  generationStatus: {
    type: String,
    enum: ['pending', 'generating', 'completed', 'failed'],
    default: 'pending'
  },
  // New enhanced fields
  status: {
    type: String,
    enum: ['pending', 'generating', 'completed', 'failed', 'ready_for_browser'],
    default: 'pending'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  contentType: {
    type: String,
    enum: ['summary', 'full_text'],
    default: 'full_text'
  },
  voiceSettings: {
    speed: { type: Number, default: 1 },
    pitch: { type: Number, default: 1 },
    volume: { type: Number, default: 1 }
  },
  audioPath: String,
  audioUrl: String,
  audioInstructions: String, // For browser-based TTS
  fileSize: Number,
  wordCount: Number,
  estimatedDuration: Number, // in seconds
  actualDuration: Number, // in seconds
  completedAt: Date,
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

// Index for efficient queries
podcastSchema.index({ userId: 1, status: 1 });
podcastSchema.index({ documentId: 1 });

module.exports = mongoose.models.Podcast || mongoose.model('Podcast', podcastSchema);