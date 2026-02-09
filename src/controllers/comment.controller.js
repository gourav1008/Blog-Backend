const Comment = require('../models/Comment');
const Post = require('../models/Post');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const createComment = catchAsync(async (req, res) => {
    const { content, postId, parentCommentId } = req.body;
    const comment = await Comment.create({
        content,
        post: postId,
        author: req.user.id,
        parentComment: parentCommentId || null,
    });

    if (parentCommentId) {
        await Comment.findByIdAndUpdate(parentCommentId, {
            $push: { replies: comment._id }
        });
    }

    res.status(201).send(comment);
});

const getCommentsByPost = catchAsync(async (req, res) => {
    const comments = await Comment.find({ post: req.params.postId, parentComment: null, isDeleted: false })
        .populate({
            path: 'replies',
            populate: { path: 'author', select: 'name avatar' }
        })
        .populate('author', 'name avatar');
    res.send(comments);
});

const deleteComment = catchAsync(async (req, res) => {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) throw new ApiError(404, 'Comment not found');

    if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
        throw new ApiError(403, 'Forbidden');
    }

    comment.isDeleted = true;
    await comment.save();
    res.status(204).send();
});

module.exports = {
    createComment,
    getCommentsByPost,
    deleteComment,
};
