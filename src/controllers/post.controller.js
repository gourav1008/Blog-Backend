const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const postService = require('../services/post.service');

const createPost = catchAsync(async (req, res) => {
    const { tags, ...body } = req.body;
    const post = await postService.createPost({
        ...body,
        author_id: req.user.id,
        tags: tags || [],
    });
    res.status(201).json({ success: true, data: post });
});

const getPosts = catchAsync(async (req, res) => {
    const isAdmin = req.user && ['admin', 'editor'].includes(req.user.role);
    const result = await postService.queryPosts({
        status: req.query.status,
        categorySlug: req.query.category,
        tagSlug: req.query.tag,
        authorId: req.query.author,
        search: req.query.search,
        sortBy: req.query.sortBy || 'latest',
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 10,
        isAdmin,
    });
    res.json({ success: true, data: result });
});

const getPostBySlug = catchAsync(async (req, res) => {
    const post = await postService.getPostBySlug(req.params.slug);
    res.json({ success: true, data: post });
});

const updatePost = catchAsync(async (req, res) => {
    const post = await postService.updatePost(req.params.postId, req.body, req.user);
    res.json({ success: true, data: post });
});

const deletePost = catchAsync(async (req, res) => {
    await postService.deletePost(req.params.postId, req.user);
    res.status(204).send();
});

const getFeaturedPosts = catchAsync(async (req, res) => {
    const posts = await postService.getFeaturedPosts();
    res.json({ success: true, data: posts });
});

const getTrendingPosts = catchAsync(async (req, res) => {
    const posts = await postService.getTrendingPosts();
    res.json({ success: true, data: posts });
});

const likePost = catchAsync(async (req, res) => {
    const result = await postService.likePost(req.params.postId, req.user.id);
    res.json({ success: true, data: result });
});

const unlikePost = catchAsync(async (req, res) => {
    const result = await postService.unlikePost(req.params.postId, req.user.id);
    res.json({ success: true, data: result });
});

const getPost = catchAsync(async (req, res) => {
    const post = await postService.getPostById(req.params.postId);
    res.json({ success: true, data: post });
});

const searchPosts = catchAsync(async (req, res) => {
    // searchPosts is effectively the same as getPosts with a search query
    return getPosts(req, res);
});

const getRelatedPosts = catchAsync(async (req, res) => {
    const posts = await postService.getRelatedPosts(req.params.postId);
    res.json({ success: true, data: posts });
});

const getAllTags = catchAsync(async (req, res) => {
    const tags = await postService.getTags();
    res.json({ success: true, data: tags });
});

module.exports = {
    createPost,
    getPosts,
    getPost,
    getPostBySlug,
    searchPosts,
    getRelatedPosts,
    getAllTags,
    updatePost,
    deletePost,
    getFeaturedPosts,
    getTrendingPosts,
    likePost,
    unlikePost,
};
