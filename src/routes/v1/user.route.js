const express = require('express');
const { auth, authorize } = require('../../middleware/auth');
const userController = require('../../controllers/user.controller');

const router = express.Router();

// Current user routes
router.get('/me', auth, userController.getProfile);
router.patch('/me', auth, userController.updateProfile);
router.get('/me/bookmarks', auth, userController.getBookmarks);
router.post('/me/bookmarks/:postId', auth, userController.addBookmark);
router.delete('/me/bookmarks/:postId', auth, userController.removeBookmark);
router.get('/me/comments', auth, userController.getUserComments);

// User posts
router.get('/:userId/posts', userController.getUserPosts);

// Admin routes
router.get('/', auth, authorize('admin'), userController.getAllUsers);
router.patch('/:userId/ban', auth, authorize('admin'), userController.banUser);
router.patch('/:userId/role', auth, authorize('admin'), userController.updateUserRole);

module.exports = router;
