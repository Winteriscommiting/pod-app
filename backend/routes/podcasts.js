const express = require('express');
const router = express.Router();
const {
  createPodcast,
  getPodcasts,
  getPodcastById,
  updatePodcast,
  deletePodcast,
  getPodcastProgress,
  downloadPodcast,
  getDashboardStats
} = require('../controllers/podcastController');
const auth = require('../middleware/auth');

// @route   POST /api/podcasts
// @desc    Create new podcast
// @access  Private
router.post('/', auth, createPodcast);

// @route   GET /api/podcasts
// @desc    Get user's podcasts
// @access  Private
router.get('/', auth, getPodcasts);

// @route   GET /api/podcasts/stats
// @desc    Get dashboard stats
// @access  Private
router.get('/stats', auth, getDashboardStats);

// @route   GET /api/podcasts/:id
// @desc    Get specific podcast
// @access  Private
router.get('/:id', auth, getPodcastById);

// @route   PUT /api/podcasts/:id
// @desc    Update podcast
// @access  Private
router.put('/:id', auth, updatePodcast);

// @route   DELETE /api/podcasts/:id
// @desc    Delete podcast
// @access  Private
router.delete('/:id', auth, deletePodcast);

// @route   GET /api/podcasts/:id/progress
// @desc    Get podcast generation progress
// @access  Private
router.get('/:id/progress', auth, getPodcastProgress);

// @route   GET /api/podcasts/:id/download
// @desc    Download podcast audio
// @access  Private
router.get('/:id/download', auth, downloadPodcast);

// @route   DELETE /api/podcasts/:id
// @desc    Delete podcast
// @access  Private
router.delete('/:id', auth, deletePodcast);

module.exports = router;
