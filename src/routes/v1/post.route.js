const express = require('express');
const { protect, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const postValidator = require('../../validators/post.validator');
const postController = require('../../controllers/post.controller');

const router = express.Router();

router
    .route('/')
    .post(protect, authorize('admin', 'editor'), validate(postValidator.createPost), postController.createPost)
    .get(postController.getPosts);

router.get('/search', postController.searchPosts);
router.get('/featured', postController.getFeaturedPosts);
router.get('/trending', postController.getTrendingPosts);

router.get('/:slug', postController.getPostBySlug);

router
    .route('/:postId')
    .get(postController.getPost)
    .patch(protect, validate(postValidator.updatePost), postController.updatePost)
    .delete(protect, postController.deletePost);

router.get('/:postId/related', postController.getRelatedPosts);
router.post('/:postId/like', protect, postController.likePost);
router.delete('/:postId/like', protect, postController.unlikePost);

module.exports = router;
