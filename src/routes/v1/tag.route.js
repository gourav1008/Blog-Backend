const express = require('express');
const { protect, authorize } = require('../../middleware/auth');
const tagController = require('../../controllers/tag.controller');

const router = express.Router();

// Public routes
router.get('/', tagController.getAllTags);
router.get('/:slug', tagController.getTagBySlug);

// Admin-only routes
router.post('/', protect, authorize('admin'), tagController.createTag);
router.patch('/:id', protect, authorize('admin'), tagController.updateTag);
router.delete('/:id', protect, authorize('admin'), tagController.deleteTag);

module.exports = router;
