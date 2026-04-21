const express = require('express');
const { protect, authorize } = require('../../middleware/auth');
const adminController = require('../../controllers/admin.controller');

const router = express.Router();

// All routes here should be protected by admin or editor roles
router.use(protect);
router.use(authorize('admin', 'editor'));

router.get('/stats', adminController.getDashboardStats);

// User Management
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId', adminController.updateUser);
router.delete('/users/:userId', adminController.deleteUser);

// Comment Management
router.get('/comments', adminController.getAllComments);
router.delete('/comments/:commentId', adminController.deleteComment);

// Post Management
router.get('/posts', adminController.getAllPosts);
router.get('/posts/:postId', adminController.getPostById);
router.post('/posts', adminController.createPost);
router.put('/posts/:postId', adminController.updatePost);
router.delete('/posts/:postId', adminController.deletePost);

// Category & Tag Management
router.get('/categories', adminController.getAllCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

router.get('/tags', adminController.getAllTags);
router.post('/tags', adminController.createTag);
router.put('/tags/:id', adminController.updateTag);
router.delete('/tags/:id', adminController.deleteTag);

module.exports = router;
