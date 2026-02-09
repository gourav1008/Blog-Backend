const express = require('express');
const { auth, authorize } = require('../../middleware/auth');
const analyticsController = require('../../controllers/analytics.controller');

const router = express.Router();

router.get('/dashboard', auth, authorize('admin', 'editor'), analyticsController.getDashboardStats);
router.get('/trending', analyticsController.getTrendingPosts);
router.get('/:postId', auth, authorize('admin', 'editor'), analyticsController.getPostStats);

module.exports = router;
