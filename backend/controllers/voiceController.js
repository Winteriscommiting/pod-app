const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
    // Return available AI voices and user's voice samples
    const user = await User.findById(req.user.id);
    const userVoices = user.voiceSamples || [];

    const aiVoices = [
      {
        id: 'voice-1',
        name: 'Sarah',
        description: 'Female, Professional',
        type: 'ai',
        language: 'en-US',
        gender: 'female'
      },
      {
        id: 'voice-2',
        name: 'Michael',
        description: 'Male, Narrator',
        type: 'ai',
        language: 'en-US',
        gender: 'male'
      },
      {
        id: 'voice-3',
        name: 'Emma',
        description: 'Female, Conversational',
        type: 'ai',
        language: 'en-US',
        gender: 'female'
      },
      {
        id: 'voice-4',
        name: 'David',
        description: 'Male, Authoritative',
        type: 'ai',
        language: 'en-US',
        gender: 'male'
      }
    ];

    const customVoices = userVoices.map(voice => ({
      id: voice.id,
      name: voice.name,
      description: voice.description,
      type: 'custom',
      status: voice.status,
      uploadedAt: voice.uploadedAt
    }));

    res.json({
      success: true,
      data: {
        ai: aiVoices,
        custom: customVoices
      }
    });
  } catch (error) {
    console.error('Get available voices error:', error);
    res.status(500).json({ message: 'Server error' });
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
    const { voiceId, text, voiceType } = req.body;
    
    if (!text || text.length < 1) {
      return res.status(400).json({ message: 'Text is required for voice testing' });
    }

    if (text.length > 200) {
      return res.status(400).json({ message: 'Text too long for testing (max 200 characters)' });
    }

    // Simulate text-to-speech generation
    // In real implementation, this would generate actual audio
    
    res.json({
      success: true,
      message: 'Voice test completed',
      data: {
        voiceId,
        voiceType,
        text,
        audioUrl: `/api/voice/test-audio/${voiceId}`, // Placeholder URL
        duration: Math.ceil(text.length / 10) // Rough estimation
      }
    });
  } catch (error) {
    console.error('Test voice error:', error);
    res.status(500).json({ message: 'Server error' });
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

exports.getAvailableVoices = async (req, res) => {
  try {
    const aiVoices = TextToSpeechService.getAvailableVoices();
    const user = await User.findById(req.user._id).select('voiceSamples');
    const userVoices = user.voiceSamples
      .filter(sample => sample.isActive)
      .map(sample => ({
        id: sample._id.toString(),
        name: sample.originalName,
        type: 'cloned',
        duration: sample.duration
      }));

    res.json({
      success: true,
      voices: {
        ai: aiVoices.map(voice => ({ ...voice, type: 'ai' })),
        cloned: userVoices
      }
    });
  } catch (error) {
    console.error('Get available voices error:', error);
    res.status(500).json({ message: 'Error fetching available voices' });
  }
};

exports.testVoice = async (req, res) => {
  try {
    const { voiceId, voiceType, text } = req.body;
    const testText = text || 'Hello! This is a test of your selected voice. How does it sound?';

    let audioResult;

    if (voiceType === 'ai') {
      audioResult = await TextToSpeechService.generateSpeech(testText, voiceId, 'medium');
    } else if (voiceType === 'cloned') {
      audioResult = await VoiceClonerService.cloneVoice(testText, voiceId, req.user._id);
    } else {
      return res.status(400).json({ message: 'Invalid voice type' });
    }

    res.json({
      success: true,
      message: 'Voice test generated successfully',
      audio: {
        filename: audioResult.filename,
        duration: audioResult.duration
      }
    });
  } catch (error) {
    console.error('Voice test error:', error);
    res.status(500).json({ message: 'Error testing voice' });
  }
};

exports.streamVoiceTest = async (req, res) => {
  try {
    const { filename } = req.params;
    const audioPath = path.join(__dirname, '../uploads/audio', filename);
    
    // Check if file exists
    try {
      await fs.access(audioPath);
    } catch (error) {
      return res.status(404).json({ message: 'Audio file not found' });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    const stream = require('fs').createReadStream(audioPath);
    stream.pipe(res);
  } catch (error) {
    console.error('Stream voice test error:', error);
    res.status(500).json({ message: 'Error streaming audio' });
  }
};
