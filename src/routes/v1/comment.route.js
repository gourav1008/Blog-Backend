const express = require('express');
const { auth } = require('../../middleware/auth');
const commentController = require('../../controllers/comment.controller');

const router = express.Router();

router.post('/', auth, commentController.createComment);
router.get('/:postId', commentController.getCommentsByPost);
router.delete('/:commentId', auth, commentController.deleteComment);

module.exports = router;
