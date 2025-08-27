const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updatePassword,
  uploadAvatar,
  getSettings,
  updateSettings,
  getDashboardData,
  deleteAccount
} = require('../controllers/userController');
const auth = require('../middleware/auth');

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, getProfile);

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, updateProfile);

// @route   PUT /api/user/password
// @desc    Update user password
// @access  Private
router.put('/password', auth, updatePassword);

// @route   POST /api/user/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/avatar', auth, uploadAvatar);

// @route   GET /api/user/settings
// @desc    Get user settings
// @access  Private
router.get('/settings', auth, getSettings);

// @route   PUT /api/user/settings
// @desc    Update user settings
// @access  Private
router.put('/settings', auth, updateSettings);

// @route   GET /api/user/dashboard
// @desc    Get dashboard data
// @access  Private
router.get('/dashboard', auth, getDashboardData);

// @route   DELETE /api/user/account
// @desc    Delete user account
// @access  Private
router.delete('/account', auth, deleteAccount);

module.exports = router;
