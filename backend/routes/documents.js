const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  uploadDocument,
  testUploadDocument,
  getDocuments,
  deleteDocument,
  getDocumentById,
  updateDocument,
  getDocumentSummary,
  regenerateSummary,
  summarizeDocumentManually,
  getDocumentsWithSummaries,
  getSummarizationStats
} = require('../controllers/documentController');

// @route   POST /api/documents/upload
// @desc    Upload and process document
// @access  Private
router.post('/upload', auth, uploadDocument);

// @route   POST /api/documents/test-upload
// @desc    Test upload without authentication (for testing only)
// @access  Public
router.post('/test-upload', testUploadDocument);

// @route   GET /api/documents
// @desc    Get user documents
// @access  Private
router.get('/', auth, getDocuments);

// @route   GET /api/documents/summaries
// @desc    Get user documents with summaries
// @access  Private
router.get('/summaries', auth, getDocumentsWithSummaries);

// @route   GET /api/documents/stats/summarization
// @desc    Get summarization statistics
// @access  Private
router.get('/stats/summarization', auth, getSummarizationStats);

// @route   GET /api/documents/:id
// @desc    Get single document
// @access  Private
router.get('/:id', auth, getDocumentById);

// @route   GET /api/documents/:id/summary
// @desc    Get document summary
// @access  Private
router.get('/:id/summary', auth, getDocumentSummary);

// @route   PUT /api/documents/:id
// @desc    Update document
// @access  Private
router.put('/:id', auth, updateDocument);

// @route   POST /api/documents/:id/summarize
// @desc    Manually summarize document
// @access  Private
router.post('/:id/summarize', auth, summarizeDocumentManually);

// @route   POST /api/documents/:id/regenerate-summary
// @desc    Regenerate document summary
// @access  Private
router.post('/:id/regenerate-summary', auth, regenerateSummary);

// @route   DELETE /api/documents/:id
// @desc    Delete document
// @access  Private
router.delete('/:id', auth, deleteDocument);

module.exports = router;
