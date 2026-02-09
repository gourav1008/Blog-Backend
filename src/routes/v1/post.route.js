const express = require('express');
const { auth, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const postValidator = require('../../validators/post.validator');
const postController = require('../../controllers/post.controller');

const router = express.Router();

router
    .route('/')
    .post(auth, authorize('admin', 'editor'), validate(postValidator.createPost), postController.createPost)
    .get(postController.getPosts);

router.get('/search', postController.searchPosts);
router.get('/featured', postController.getFeaturedPosts);
router.get('/trending', postController.getTrendingPosts);

router.get('/:slug', postController.getPostBySlug);

router
    .route('/:postId')
    .patch(auth, validate(postValidator.updatePost), postController.updatePost)
    .delete(auth, postController.deletePost);

router.get('/:postId/related', postController.getRelatedPosts);
router.post('/:postId/like', auth, postController.likePost);
router.delete('/:postId/like', auth, postController.unlikePost);

module.exports = router;
