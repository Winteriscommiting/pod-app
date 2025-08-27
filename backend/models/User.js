const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  settings: {
    general: {
      defaultVoice: String,
      autoSave: { type: Boolean, default: true },
      theme: { type: String, default: 'light' },
      language: { type: String, default: 'en' }
    },
    audio: {
      quality: { type: String, default: 'high' },
      bitrate: { type: Number, default: 128 },
      speed: { type: Number, default: 1.0 },
      addIntro: { type: Boolean, default: false },
      addOutro: { type: Boolean, default: false }
    },
    privacy: {
      analytics: { type: Boolean, default: true },
      crashReports: { type: Boolean, default: true },
      dataRetention: { type: String, default: '1year' }
    },
    notifications: {
      email: { type: Boolean, default: true },
      browser: { type: Boolean, default: true },
      podcast_complete: { type: Boolean, default: true },
      voice_clone_complete: { type: Boolean, default: true }
    }
  },
  voiceSamples: [{
    id: String,
    name: String,
    filename: String,
    filepath: String,
    uploadDate: { type: Date, default: Date.now },
    type: { type: String, enum: ['standard', 'custom'], default: 'custom' },
    status: { type: String, enum: ['processing', 'ready', 'failed'], default: 'processing' },
    description: String,
    language: String,
    gender: String,
    sampleUrl: String,
    progress: { type: Number, default: 0 }
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return token;
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);