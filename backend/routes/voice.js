const express = require('express');
const router = express.Router();
const {
  uploadVoiceSample,
  getVoiceSamples,
  deleteVoiceSample,
  getAvailableVoices,
  cloneVoice,
  getVoiceCloneStatus,
  testVoice,
  getAudioFile
} = require('../controllers/voiceController');
const auth = require('../middleware/auth');

// @route   POST /api/voice/upload
// @desc    Upload voice sample
// @access  Private
router.post('/upload', auth, uploadVoiceSample);

// @route   GET /api/voice/samples
// @desc    Get user's voice samples
// @access  Private
router.get('/samples', auth, getVoiceSamples);

// @route   DELETE /api/voice/samples/:sampleId
// @desc    Delete voice sample
// @access  Private
router.delete('/samples/:sampleId', auth, deleteVoiceSample);

// @route   GET /api/voice/available
// @desc    Get available voices (AI + user cloned)
// @access  Private
router.get('/available', auth, getAvailableVoices);

// @route   POST /api/voice/clone
// @desc    Clone voice from sample
// @access  Private
router.post('/clone', auth, cloneVoice);

// @route   GET /api/voice/clone/:sampleId/status
// @desc    Get voice clone status
// @access  Private
router.get('/clone/:sampleId/status', auth, getVoiceCloneStatus);

// @route   POST /api/voice/test
// @desc    Test voice with sample text
// @access  Private
router.post('/test', auth, testVoice);

// @route   GET /api/voice/audio/:filename
// @desc    Serve generated audio files
// @access  Private
router.get('/audio/:filename', auth, getAudioFile);

module.exports = router;
