const User = require('../models/User');
const Document = require('../models/Document');
const Podcast = require('../models/Podcast');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and GIF files are allowed.'));
    }
  }
});

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user statistics
    const documentCount = await Document.countDocuments({ userId: req.user.id });
    const podcastCount = await Podcast.countDocuments({ userId: req.user.id });
    const completedPodcasts = await Podcast.countDocuments({ 
      userId: req.user.id, 
      status: 'completed' 
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          createdAt: user.createdAt,
          settings: user.settings || {},
          voiceSamples: user.voiceSamples || []
        },
        stats: {
          documents: documentCount,
          podcasts: podcastCount,
          completedPodcasts
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const updates = {};

    if (name) updates.name = name.trim();
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: req.user.id }
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already in use' });
      }
      
      updates.email = email.toLowerCase();
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'New password must be at least 6 characters long' 
      });
    }

    const user = await User.findById(req.user.id);
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.uploadAvatar = [
  upload.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No avatar file uploaded' });
      }

      const user = await User.findById(req.user.id);
      
      // Delete old avatar if exists
      if (user.avatar && fs.existsSync(user.avatar)) {
        fs.unlinkSync(user.avatar);
      }

      // Update user with new avatar path
      const avatarPath = req.file.path;
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      
      await User.findByIdAndUpdate(req.user.id, { 
        avatar: avatarPath,
        avatarUrl 
      });

      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatarUrl
        }
      });

    } catch (error) {
      console.error('Upload avatar error:', error);
      
      // Clean up uploaded file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ message: 'Server error during avatar upload' });
    }
  }
];

exports.getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('settings');
    
    const defaultSettings = {
      theme: 'dark',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        podcastComplete: true,
        documentProcessed: true
      },
      audio: {
        quality: 'high',
        speed: 1.0,
        autoPlay: false
      },
      privacy: {
        profilePublic: false,
        activityVisible: false
      }
    };

    const settings = { ...defaultSettings, ...(user.settings || {}) };

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { theme, language, notifications, audio, privacy } = req.body;
    
    const user = await User.findById(req.user.id);
    const currentSettings = user.settings || {};

    const updatedSettings = {
      ...currentSettings,
      ...(theme && { theme }),
      ...(language && { language }),
      ...(notifications && { notifications: { ...currentSettings.notifications, ...notifications } }),
      ...(audio && { audio: { ...currentSettings.audio, ...audio } }),
      ...(privacy && { privacy: { ...currentSettings.privacy, ...privacy } })
    };

    await User.findByIdAndUpdate(req.user.id, { settings: updatedSettings });

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user stats
    const [
      totalDocuments,
      totalPodcasts,
      completedPodcasts,
      processingPodcasts,
      recentDocuments,
      recentPodcasts
    ] = await Promise.all([
      Document.countDocuments({ userId }),
      Podcast.countDocuments({ userId }),
      Podcast.countDocuments({ userId, status: 'completed' }),
      Podcast.countDocuments({ userId, status: 'generating' }),
      Document.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('originalName fileType fileSize createdAt'),
      Podcast.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('documentId', 'originalName')
        .select('title status progress createdAt')
    ]);

    // Calculate total storage used
    const documentsWithSize = await Document.find({ userId }).select('fileSize');
    const totalStorage = documentsWithSize.reduce((total, doc) => total + (doc.fileSize || 0), 0);

    res.json({
      success: true,
      data: {
        stats: {
          documents: totalDocuments,
          podcasts: totalPodcasts,
          completed: completedPodcasts,
          processing: processingPodcasts,
          storage: totalStorage
        },
        recent: {
          documents: recentDocuments,
          podcasts: recentPodcasts
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required to delete account' });
    }

    const user = await User.findById(req.user.id);
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    // Delete user's files
    const documents = await Document.find({ userId: req.user.id });
    const podcasts = await Podcast.find({ userId: req.user.id });

    // Delete document files
    for (const doc of documents) {
      if (doc.filePath && fs.existsSync(doc.filePath)) {
        fs.unlinkSync(doc.filePath);
      }
    }

    // Delete podcast files
    for (const podcast of podcasts) {
      if (podcast.audioPath && fs.existsSync(podcast.audioPath)) {
        fs.unlinkSync(podcast.audioPath);
      }
    }

    // Delete avatar
    if (user.avatar && fs.existsSync(user.avatar)) {
      fs.unlinkSync(user.avatar);
    }

    // Delete voice samples
    if (user.voiceSamples) {
      for (const sample of user.voiceSamples) {
        if (sample.filePath && fs.existsSync(sample.filePath)) {
          fs.unlinkSync(sample.filePath);
        }
      }
    }

    // Delete from database
    await Document.deleteMany({ userId: req.user.id });
    await Podcast.deleteMany({ userId: req.user.id });
    await User.findByIdAndDelete(req.user.id);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
