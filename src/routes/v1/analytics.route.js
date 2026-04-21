const express = require('express');
const { protect, authorize } = require('../../middleware/auth');
const analyticsController = require('../../controllers/analytics.controller');

const router = express.Router();

router.get('/dashboard', protect, authorize('admin', 'editor'), analyticsController.getDashboardStats);
router.get('/trending', analyticsController.getTrendingPosts);
router.get('/:postId', protect, authorize('admin', 'editor'), analyticsController.getPostStats);

module.exports = router;
