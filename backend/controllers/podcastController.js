const Podcast = require('../models/Podcast');
const Document = require('../models/Document');
const textToSpeechService = require('../services/textToSpeech');
const path = require('path');
const fs = require('fs');

exports.createPodcast = async (req, res) => {
  try {
    const { documentId, title, description, voiceType, voiceSettings } = req.body;

    // Validate document exists and belongs to user
    const document = await Document.findOne({
      _id: documentId,
      userId: req.user.id
    });

    if (!document) {
      return res.status(404).json({ 
        message: 'Document not found' 
      });
    }

    // Create podcast record
    const podcast = new Podcast({
      userId: req.user.id,
      documentId,
      title: title || `Podcast from ${document.originalName}`,
      description: description || `Generated podcast from ${document.originalName}`,
      voiceType: voiceType || 'standard',
      voiceSettings: voiceSettings || { speed: 1, pitch: 1 },
      status: 'generating',
      progress: 0,
      wordCount: document.wordCount,
      estimatedDuration: Math.ceil(document.wordCount / 150) // 150 words per minute
    });

    await podcast.save();

    // Start audio generation in background
    generateAudioInBackground(podcast._id, document.extractedText, voiceType, voiceSettings);

    res.status(201).json({
      success: true,
      message: 'Podcast generation started',
      data: {
        id: podcast._id,
        title: podcast.title,
        status: podcast.status,
        progress: podcast.progress,
        estimatedDuration: podcast.estimatedDuration
      }
    });

  } catch (error) {
    console.error('Create podcast error:', error);
    res.status(500).json({ message: 'Server error during podcast creation' });
  }
};

// Background function to generate audio
async function generateAudioInBackground(podcastId, text, voiceType, voiceSettings) {
  try {
    const podcast = await Podcast.findById(podcastId);
    if (!podcast) return;

    // Update progress to 25%
    podcast.progress = 25;
    await podcast.save();

    // Generate audio using text-to-speech service
    const audioResult = await textToSpeechService.generateAudio(text, {
      voice: voiceType,
      settings: voiceSettings
    });

    if (!audioResult.success) {
      podcast.status = 'failed';
      podcast.errorMessage = audioResult.error;
      await podcast.save();
      return;
    }

    // Update progress to 75%
    podcast.progress = 75;
    await podcast.save();

    // Save audio file
    const audioFileName = `podcast-${podcastId}-${Date.now()}.mp3`;
    const audioPath = path.join(__dirname, '../uploads/podcasts', audioFileName);
    
    // Ensure directory exists
    const dir = path.dirname(audioPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write audio file
    fs.writeFileSync(audioPath, audioResult.audioBuffer);

    // Update podcast with final details
    podcast.status = 'completed';
    podcast.progress = 100;
    podcast.audioPath = audioPath;
    podcast.audioUrl = `/uploads/podcasts/${audioFileName}`;
    podcast.fileSize = audioResult.fileSize;
    podcast.actualDuration = audioResult.duration;
    podcast.completedAt = new Date();

    await podcast.save();

  } catch (error) {
    console.error('Audio generation error:', error);
    
    try {
      const podcast = await Podcast.findById(podcastId);
      if (podcast) {
        podcast.status = 'failed';
        podcast.errorMessage = error.message;
        await podcast.save();
      }
    } catch (updateError) {
      console.error('Error updating podcast status:', updateError);
    }
  }
}

exports.getPodcasts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || '';
    const search = req.query.search || '';
    
    // Build query
    let query = { userId: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count for pagination
    const total = await Podcast.countDocuments(query);
    
    // Get podcasts with pagination
    const podcasts = await Podcast.find(query)
      .populate('documentId', 'originalName fileType')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    
    res.json({
      success: true,
      data: podcasts,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get podcasts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPodcastById = async (req, res) => {
  try {
    const podcast = await Podcast.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('documentId', 'originalName fileType extractedText');
    
    if (!podcast) {
      return res.status(404).json({ message: 'Podcast not found' });
    }
    
    res.json({
      success: true,
      data: podcast
    });
  } catch (error) {
    console.error('Get podcast error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePodcast = async (req, res) => {
  try {
    const { title, description } = req.body;
    
    const podcast = await Podcast.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { 
        title: title || undefined,
        description: description || undefined,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!podcast) {
      return res.status(404).json({ message: 'Podcast not found' });
    }
    
    res.json({
      success: true,
      message: 'Podcast updated successfully',
      data: podcast
    });
  } catch (error) {
    console.error('Update podcast error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deletePodcast = async (req, res) => {
  try {
    const podcast = await Podcast.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!podcast) {
      return res.status(404).json({ message: 'Podcast not found' });
    }
    
    // Delete audio file if exists
    if (podcast.audioPath && fs.existsSync(podcast.audioPath)) {
      fs.unlinkSync(podcast.audioPath);
    }
    
    // Delete from database
    await Podcast.deleteOne({ _id: req.params.id });
    
    res.json({
      success: true,
      message: 'Podcast deleted successfully'
    });
  } catch (error) {
    console.error('Delete podcast error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPodcastProgress = async (req, res) => {
  try {
    const podcast = await Podcast.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).select('status progress errorMessage');
    
    if (!podcast) {
      return res.status(404).json({ message: 'Podcast not found' });
    }
    
    res.json({
      success: true,
      data: {
        status: podcast.status,
        progress: podcast.progress,
        errorMessage: podcast.errorMessage
      }
    });
  } catch (error) {
    console.error('Get podcast progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.downloadPodcast = async (req, res) => {
  try {
    const podcast = await Podcast.findOne({
      _id: req.params.id,
      userId: req.user.id,
      status: 'completed'
    });
    
    if (!podcast) {
      return res.status(404).json({ message: 'Podcast not found or not ready' });
    }
    
    if (!fs.existsSync(podcast.audioPath)) {
      return res.status(404).json({ message: 'Audio file not found' });
    }
    
    res.download(podcast.audioPath, `${podcast.title}.mp3`);
  } catch (error) {
    console.error('Download podcast error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get podcast stats
    const totalPodcasts = await Podcast.countDocuments({ userId });
    const completedPodcasts = await Podcast.countDocuments({ 
      userId, 
      status: 'completed' 
    });
    const generatingPodcasts = await Podcast.countDocuments({ 
      userId, 
      status: 'generating' 
    });
    
    // Get recent podcasts
    const recentPodcasts = await Podcast.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('documentId', 'originalName');
    
    res.json({
      success: true,
      data: {
        stats: {
          total: totalPodcasts,
          completed: completedPodcasts,
          generating: generatingPodcasts,
          failed: totalPodcasts - completedPodcasts - generatingPodcasts
        },
        recentPodcasts
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createPodcast = async (req, res) => {
  try {
    const { documentId, title, description, voiceType, voiceSettings } = req.body;

    // Validate document exists and belongs to user
    const document = await Document.findOne({
      _id: documentId,
      userId: req.user.id
    });

    if (!document) {
      return res.status(404).json({ 
        message: 'Document not found' 
      });
    }

    // Create podcast record
    const podcast = new Podcast({
      userId: req.user.id,
      documentId,
      title: title || `Podcast from ${document.originalName}`,
      description: description || `Generated podcast from ${document.originalName}`,
      voiceType: voiceType || 'standard',
      voiceSettings: voiceSettings || { speed: 1, pitch: 1 },
      status: 'generating',
      progress: 0,
      wordCount: document.wordCount,
      estimatedDuration: Math.ceil(document.wordCount / 150) // 150 words per minute
    });

    await podcast.save();

    // Start audio generation in background
    generateAudioInBackground(podcast._id, document.extractedText, voiceType, voiceSettings);

    res.status(201).json({
      success: true,
      message: 'Podcast generation started',
      data: {
        id: podcast._id,
        title: podcast.title,
        status: podcast.status,
        progress: podcast.progress,
        estimatedDuration: podcast.estimatedDuration
      }
    });

  } catch (error) {
    console.error('Create podcast error:', error);
    res.status(500).json({ message: 'Server error during podcast creation' });
  }
};

// Background function to generate audio
async function generateAudioInBackground(podcastId, text, voiceType, voiceSettings) {
  try {
    const podcast = await Podcast.findById(podcastId);
    if (!podcast) return;

    // Update progress to 25%
    podcast.progress = 25;
    await podcast.save();

    // Generate audio using text-to-speech service
    const audioResult = await textToSpeechService.generateAudio(text, {
      voice: voiceType,
      settings: voiceSettings
    });

    if (!audioResult.success) {
      podcast.status = 'failed';
      podcast.errorMessage = audioResult.error;
      await podcast.save();
      return;
    }

    // Update progress to 75%
    podcast.progress = 75;
    await podcast.save();

    // Save audio file
    const audioFileName = `podcast-${podcastId}-${Date.now()}.mp3`;
    const audioPath = path.join(__dirname, '../uploads/podcasts', audioFileName);
    
    // Ensure directory exists
    const dir = path.dirname(audioPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write audio file
    fs.writeFileSync(audioPath, audioResult.audioBuffer);

    // Update podcast with final details
    podcast.status = 'completed';
    podcast.progress = 100;
    podcast.audioPath = audioPath;
    podcast.audioUrl = `/uploads/podcasts/${audioFileName}`;
    podcast.fileSize = audioResult.fileSize;
    podcast.actualDuration = audioResult.duration;
    podcast.completedAt = new Date();

    await podcast.save();

  } catch (error) {
    console.error('Audio generation error:', error);
    
    try {
      const podcast = await Podcast.findById(podcastId);
      if (podcast) {
        podcast.status = 'failed';
        podcast.errorMessage = error.message;
        await podcast.save();
      }
    } catch (updateError) {
      console.error('Error updating podcast status:', updateError);
    }
  }
}

exports.getPodcasts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || '';
    const search = req.query.search || '';
    
    // Build query
    let query = { userId: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count for pagination
    const total = await Podcast.countDocuments(query);
    
    // Get podcasts with pagination
    const podcasts = await Podcast.find(query)
      .populate('documentId', 'originalName fileType')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    
    res.json({
      success: true,
      data: podcasts,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get podcasts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPodcastById = async (req, res) => {
  try {
    const podcast = await Podcast.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('documentId', 'originalName fileType extractedText');
    
    if (!podcast) {
      return res.status(404).json({ message: 'Podcast not found' });
    }
    
    res.json({
      success: true,
      data: podcast
    });
  } catch (error) {
    console.error('Get podcast error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePodcast = async (req, res) => {
  try {
    const { title, description } = req.body;
    
    const podcast = await Podcast.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { 
        title: title || undefined,
        description: description || undefined,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!podcast) {
      return res.status(404).json({ message: 'Podcast not found' });
    }
    
    res.json({
      success: true,
      message: 'Podcast updated successfully',
      data: podcast
    });
  } catch (error) {
    console.error('Update podcast error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deletePodcast = async (req, res) => {
  try {
    const podcast = await Podcast.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!podcast) {
      return res.status(404).json({ message: 'Podcast not found' });
    }
    
    // Delete audio file if exists
    if (podcast.audioPath && fs.existsSync(podcast.audioPath)) {
      fs.unlinkSync(podcast.audioPath);
    }
    
    // Delete from database
    await Podcast.deleteOne({ _id: req.params.id });
    
    res.json({
      success: true,
      message: 'Podcast deleted successfully'
    });
  } catch (error) {
    console.error('Delete podcast error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPodcastProgress = async (req, res) => {
  try {
    const podcast = await Podcast.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).select('status progress errorMessage');
    
    if (!podcast) {
      return res.status(404).json({ message: 'Podcast not found' });
    }
    
    res.json({
      success: true,
      data: {
        status: podcast.status,
        progress: podcast.progress,
        errorMessage: podcast.errorMessage
      }
    });
  } catch (error) {
    console.error('Get podcast progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.downloadPodcast = async (req, res) => {
  try {
    const podcast = await Podcast.findOne({
      _id: req.params.id,
      userId: req.user.id,
      status: 'completed'
    });
    
    if (!podcast) {
      return res.status(404).json({ message: 'Podcast not found or not ready' });
    }
    
    if (!fs.existsSync(podcast.audioPath)) {
      return res.status(404).json({ message: 'Audio file not found' });
    }
    
    res.download(podcast.audioPath, `${podcast.title}.mp3`);
  } catch (error) {
    console.error('Download podcast error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get podcast stats
    const totalPodcasts = await Podcast.countDocuments({ userId });
    const completedPodcasts = await Podcast.countDocuments({ 
      userId, 
      status: 'completed' 
    });
    const generatingPodcasts = await Podcast.countDocuments({ 
      userId, 
      status: 'generating' 
    });
    
    // Get recent podcasts
    const recentPodcasts = await Podcast.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('documentId', 'originalName');
    
    res.json({
      success: true,
      data: {
        stats: {
          total: totalPodcasts,
          completed: completedPodcasts,
          generating: generatingPodcasts,
          failed: totalPodcasts - completedPodcasts - generatingPodcasts
        },
        recentPodcasts
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
