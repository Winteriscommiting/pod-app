const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const textToSpeechService = require('../services/textToSpeech');

// Configure multer for voice sample uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/voice-samples');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'voice-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.wav', '.mp3', '.m4a', '.flac'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only WAV, MP3, M4A, and FLAC files are allowed.'));
    }
  }
});

exports.uploadVoiceSample = [
  upload.single('voiceSample'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No voice sample uploaded' });
      }

      const { name, description } = req.body;
      const filePath = req.file.path;

      // Save voice sample info to user
      const user = await User.findById(req.user.id);
      if (!user.voiceSamples) {
        user.voiceSamples = [];
      }

      const voiceSample = {
        id: req.file.filename,
        name: name || req.file.originalname,
        description: description || '',
        filename: req.file.filename,
        filePath,
        fileSize: req.file.size,
        uploadedAt: new Date(),
        status: 'uploaded'
      };

      user.voiceSamples.push(voiceSample);
      await user.save();

      res.json({
        success: true,
        message: 'Voice sample uploaded successfully',
        data: voiceSample
      });

    } catch (error) {
      console.error('Voice sample upload error:', error);
      
      // Clean up uploaded file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ message: 'Server error during voice sample upload' });
    }
  }
];

exports.getVoiceSamples = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const voiceSamples = user.voiceSamples || [];

    res.json({
      success: true,
      data: voiceSamples
    });
  } catch (error) {
    console.error('Get voice samples error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteVoiceSample = async (req, res) => {
  try {
    const { sampleId } = req.params;
    const user = await User.findById(req.user.id);
    
    if (!user.voiceSamples) {
      return res.status(404).json({ message: 'Voice sample not found' });
    }

    const sampleIndex = user.voiceSamples.findIndex(sample => sample.id === sampleId);
    
    if (sampleIndex === -1) {
      return res.status(404).json({ message: 'Voice sample not found' });
    }

    const sample = user.voiceSamples[sampleIndex];
    
    // Delete file from filesystem
    if (fs.existsSync(sample.filePath)) {
      fs.unlinkSync(sample.filePath);
    }

    // Remove from user's voice samples
    user.voiceSamples.splice(sampleIndex, 1);
    await user.save();

    res.json({
      success: true,
      message: 'Voice sample deleted successfully'
    });
  } catch (error) {
    console.error('Delete voice sample error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAvailableVoices = async (req, res) => {
  try {
    // Get available AI voices from TTS service and user's voice samples
    const user = await User.findById(req.user.id);
    const userVoices = user.voiceSamples || [];

    // Get AI voices from the TTS service
    const aiVoices = await textToSpeechService.getAvailableVoices();
    const formattedAiVoices = aiVoices.map(voice => ({
      ...voice,
      type: 'ai',
      description: `${voice.gender || 'Unknown'}, ${voice.name}`
    }));

    // Format user voices
    const formattedUserVoices = userVoices.map(voice => ({
      id: voice.id,
      name: voice.name,
      description: voice.description || 'Custom voice',
      type: 'custom',
      language: voice.language || 'en-US',
      gender: voice.gender || 'unknown',
      filepath: voice.filepath
    }));

    const allVoices = {
      ai: formattedAiVoices,
      custom: formattedUserVoices,
      total: formattedAiVoices.length + formattedUserVoices.length
    };

    res.json({
      success: true,
      voices: allVoices
    });
  } catch (error) {
    console.error('Error fetching voices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available voices',
      error: error.message
    });
  }
};

exports.cloneVoice = async (req, res) => {
  try {
    const { sampleId, name, description } = req.body;
    
    const user = await User.findById(req.user.id);
    const voiceSample = user.voiceSamples?.find(sample => sample.id === sampleId);
    
    if (!voiceSample) {
      return res.status(404).json({ message: 'Voice sample not found' });
    }

    // Simulate voice cloning process (in real implementation, this would use actual AI)
    voiceSample.status = 'processing';
    await user.save();

    // Simulate processing time
    setTimeout(async () => {
      try {
        const user = await User.findById(req.user.id);
        const sample = user.voiceSamples.find(s => s.id === sampleId);
        if (sample) {
          sample.status = 'ready';
          sample.clonedAt = new Date();
          await user.save();
        }
      } catch (error) {
        console.error('Voice cloning completion error:', error);
      }
    }, 5000); // 5 seconds simulation

    res.json({
      success: true,
      message: 'Voice cloning started',
      data: {
        id: sampleId,
        status: 'processing'
      }
    });
  } catch (error) {
    console.error('Clone voice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getVoiceCloneStatus = async (req, res) => {
  try {
    const { sampleId } = req.params;
    const user = await User.findById(req.user.id);
    const voiceSample = user.voiceSamples?.find(sample => sample.id === sampleId);
    
    if (!voiceSample) {
      return res.status(404).json({ message: 'Voice sample not found' });
    }

    res.json({
      success: true,
      data: {
        id: sampleId,
        status: voiceSample.status,
        clonedAt: voiceSample.clonedAt
      }
    });
  } catch (error) {
    console.error('Get voice clone status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.testVoice = async (req, res) => {
  try {
    const { voiceId, text, voiceType = 'ai' } = req.body;
    
    if (!text || text.length < 1) {
      return res.status(400).json({ message: 'Text is required for voice testing' });
    }

    if (text.length > 200) {
      return res.status(400).json({ message: 'Text too long for testing (max 200 characters)' });
    }

    if (!voiceId) {
      return res.status(400).json({ message: 'Voice ID is required' });
    }

    // Generate audio using free TTS service
    const audioResult = await textToSpeechService.generateAudio(text, {
      voice: voiceId,
      settings: { speed: 1.0 }
    });

    if (!audioResult.success) {
      return res.status(500).json({ 
        success: false,
        message: 'Failed to generate voice test audio' 
      });
    }

    // For browser TTS, return instructions for frontend
    if (audioResult.type === 'browser-tts') {
      return res.json({
        success: true,
        message: 'Voice test ready for browser synthesis',
        data: {
          voiceId,
          voiceType,
          text,
          type: 'browser-tts',
          instructions: `/api/voice/audio/${audioResult.filename}`,
          duration: audioResult.duration,
          provider: 'Browser Speech Synthesis (FREE)'
        }
      });
    }

    // For system TTS, return audio file URL
    const audioUrl = `/api/voice/audio/${audioResult.filename}`;
    
    res.json({
      success: true,
      message: 'Voice test completed',
      data: {
        voiceId,
        voiceType,
        text,
        audioUrl,
        filename: audioResult.filename,
        duration: audioResult.duration,
        fileSize: audioResult.fileSize,
        provider: textToSpeechService.getProviderInfo().name
      }
    });
  } catch (error) {
    console.error('Test voice error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to test voice',
      error: error.message,
      suggestion: 'Using free browser-based TTS. No API keys required!'
    });
  }
};

exports.getUserVoiceSamples = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('voiceSamples');
    
    const activeVoiceSamples = user.voiceSamples.filter(sample => sample.isActive);

    res.json({
      success: true,
      voiceSamples: activeVoiceSamples
    });
  } catch (error) {
    console.error('Get voice samples error:', error);
    res.status(500).json({ message: 'Error fetching voice samples' });
  }
};

exports.deleteVoiceSample = async (req, res) => {
  try {
    const { sampleId } = req.params;
    
    const user = await User.findById(req.user._id);
    const voiceSample = user.voiceSamples.id(sampleId);

    if (!voiceSample) {
      return res.status(404).json({ message: 'Voice sample not found' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../uploads/voices', voiceSample.filename);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting voice file:', error);
    }

    // Remove from user's voice samples
    user.voiceSamples.pull(sampleId);
    await user.save();

    res.json({
      success: true,
      message: 'Voice sample deleted successfully'
    });
  } catch (error) {
    console.error('Delete voice sample error:', error);
    res.status(500).json({ message: 'Error deleting voice sample' });
  }
};

// Serve generated audio files
exports.getAudioFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = textToSpeechService.getAudioFilePath(filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: 'Audio file not found' });
    }

    // Set appropriate headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    // Stream the audio file
    const audioStream = fs.createReadStream(filepath);
    audioStream.pipe(res);
  } catch (error) {
    console.error('Error serving audio file:', error);
    res.status(500).json({ message: 'Error serving audio file' });
  }
};
