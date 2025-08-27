const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  uploadDocument,
  getDocuments,
  deleteDocument,
  getDocumentById,
  updateDocument
} = require('../controllers/documentController');

// @route   POST /api/documents/upload
// @desc    Upload and process document
// @access  Private
router.post('/upload', auth, uploadDocument);

// @route   GET /api/documents
// @desc    Get user documents
// @access  Private
router.get('/', auth, getDocuments);

// @route   GET /api/documents/:id
// @desc    Get single document
// @access  Private
router.get('/:id', auth, getDocumentById);

// @route   PUT /api/documents/:id
// @desc    Update document
// @access  Private
router.put('/:id', auth, updateDocument);

// @route   DELETE /api/documents/:id
// @desc    Delete document
// @access  Private
router.delete('/:id', auth, deleteDocument);

module.exports = router;
