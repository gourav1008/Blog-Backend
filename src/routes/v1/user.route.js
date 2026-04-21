const express = require('express');
const { protect, authorize } = require('../../middleware/auth');
const userController = require('../../controllers/user.controller');

const router = express.Router();

// Current user routes
router.get('/me', protect, userController.getProfile);
router.patch('/me', protect, userController.updateProfile);
router.get('/me/bookmarks', protect, userController.getBookmarks);
router.get('/me/likes', protect, userController.getLikedPosts);
router.post('/me/bookmarks/:postId', protect, userController.addBookmark);
router.delete('/me/bookmarks/:postId', protect, userController.removeBookmark);
router.get('/me/comments', protect, userController.getUserComments);

// User posts
router.get('/:userId/posts', userController.getUserPosts);

// Admin routes
router.get('/', protect, authorize('admin'), userController.getAllUsers);
router.patch('/:userId/ban', protect, authorize('admin'), userController.banUser);
router.patch('/:userId/role', protect, authorize('admin'), userController.updateUserRole);

module.exports = router;
