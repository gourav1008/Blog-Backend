const express = require('express');
const { protect } = require('../../middleware/auth');
const commentController = require('../../controllers/comment.controller');

const router = express.Router();

router.post('/', protect, commentController.createComment);
router.get('/:postId', commentController.getCommentsByPost);
router.delete('/:commentId', protect, commentController.deleteComment);

module.exports = router;
