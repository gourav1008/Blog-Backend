const Post = require('../models/Post');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const postService = require('../services/post.service');

const createPost = catchAsync(async (req, res) => {
    const post = await postService.createPost({ ...req.body, author: req.user.id });
    res.status(201).json({ data: post });
});

const getPosts = catchAsync(async (req, res) => {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.tag) filter.tags = req.query.tag;
    if (req.query.author) filter.author = req.query.author;
    if (req.query.status) filter.status = req.query.status;

    const options = {
        sortBy: req.query.sortBy,
        limit: parseInt(req.query.limit, 10) || 10,
        page: parseInt(req.query.page, 10) || 1,
        search: req.query.search,
    };

    const result = await postService.queryPosts(filter, options);
    res.send({ data: result });
});

const getPostBySlug = catchAsync(async (req, res) => {
    const post = await postService.getPostBySlug(req.params.slug);
    if (!post) {
        throw new ApiError(404, 'Post not found');
    }
    res.send({ data: post });
});

const updatePost = catchAsync(async (req, res) => {
    const post = await postService.updatePostById(req.params.postId, req.body, req.user);
    res.send(post);
});

const deletePost = catchAsync(async (req, res) => {
    await postService.deletePostById(req.params.postId, req.user);
    res.status(204).send();
});

const getFeaturedPosts = catchAsync(async (req, res) => {
    const posts = await postService.getFeaturedPosts();
    res.send({ data: posts });
});

const getTrendingPosts = catchAsync(async (req, res) => {
    const posts = await postService.getTrendingPosts();
    res.send({ data: posts });
});

const searchPosts = catchAsync(async (req, res) => {
    const { q } = req.query;
    if (!q) {
        throw new ApiError(400, 'Search query is required');
    }

    const options = {
        limit: parseInt(req.query.limit, 10) || 10,
        page: parseInt(req.query.page, 10) || 1,
    };

    const result = await postService.searchPosts(q, options);
    res.send({ data: result });
});

const getRelatedPosts = catchAsync(async (req, res) => {
    const posts = await postService.getRelatedPosts(req.params.postId);
    res.send({ data: posts });
});

const likePost = catchAsync(async (req, res) => {
    const result = await postService.toggleLike(req.params.postId, req.user.id);
    res.send(result);
});

const unlikePost = catchAsync(async (req, res) => {
    const result = await postService.toggleLike(req.params.postId, req.user.id);
    res.send(result);
});

module.exports = {
    createPost,
    getPosts,
    getPostBySlug,
    updatePost,
    deletePost,
    getFeaturedPosts,
    getTrendingPosts,
    searchPosts,
    getRelatedPosts,
    likePost,
    unlikePost,
};
