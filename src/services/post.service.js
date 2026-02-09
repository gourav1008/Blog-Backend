const Post = require('../models/Post');
const ApiError = require('../utils/ApiError');
const { slugify } = require('../utils/slugify');

const createPost = async (postBody) => {
    let slug = slugify(postBody.title);
    const existingPost = await Post.findOne({ slug });
    if (existingPost) {
        slug = `${slug}-${Date.now()}`;
    }
    return Post.create({ ...postBody, slug });
};

const queryPosts = async (filter, options) => {
    const { limit, page, sortBy, search } = options;
    const skip = (page - 1) * limit;

    const finalFilter = { ...filter, isDeleted: false };

    if (search) {
        finalFilter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
            { excerpt: { $regex: search, $options: 'i' } }
        ];
    }

    const posts = await Post.find(finalFilter)
        .populate('author', 'name avatar')
        .populate('category', 'name slug')
        .sort(sortBy ? sortBy.split(':').join(' ') : 'createdAt:desc')
        .skip(skip)
        .limit(limit);

    const total = await Post.countDocuments(finalFilter);

    return { posts, total, page, limit };
};

const getPostBySlug = async (slug) => {
    const post = await Post.findOneAndUpdate(
        { slug, isDeleted: false },
        { $inc: { viewCount: 1 } },
        { new: true }
    ).populate('author', 'name bio avatar').populate('category', 'name slug').populate('tags', 'name slug');

    return post;
};

const updatePostById = async (postId, updateBody, user) => {
    const post = await Post.findById(postId);
    if (!post) throw new ApiError(404, 'Post not found');

    // Check if user is author or admin
    if (post.author.toString() !== user.id && user.role !== 'admin') {
        throw new ApiError(403, 'Forbidden');
    }

    if (updateBody.title) {
        updateBody.slug = slugify(updateBody.title);
    }

    Object.assign(post, updateBody);
    await post.save();
    return post;
};

const deletePostById = async (postId, user) => {
    const post = await Post.findById(postId);
    if (!post) throw new ApiError(404, 'Post not found');

    if (post.author.toString() !== user.id && user.role !== 'admin') {
        throw new ApiError(403, 'Forbidden');
    }

    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();
};

const getFeaturedPosts = async () => {
    return Post.find({ isFeatured: true, isDeleted: false, status: 'published' })
        .populate('author', 'name avatar')
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .limit(5);
};

const getTrendingPosts = async () => {
    return Post.find({ isDeleted: false, status: 'published' })
        .populate('author', 'name avatar')
        .populate('category', 'name slug')
        .sort({ viewCount: -1, createdAt: -1 })
        .limit(6);
};

const searchPosts = async (query, options = {}) => {
    const { limit = 10, page = 1 } = options;
    const skip = (page - 1) * limit;

    const searchFilter = {
        isDeleted: false,
        status: 'published',
        $or: [
            { title: { $regex: query, $options: 'i' } },
            { content: { $regex: query, $options: 'i' } },
            { excerpt: { $regex: query, $options: 'i' } }
        ]
    };

    const posts = await Post.find(searchFilter)
        .populate('author', 'name avatar')
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Post.countDocuments(searchFilter);

    return { posts, total, page, limit };
};

const getRelatedPosts = async (postId) => {
    const post = await Post.findById(postId);
    if (!post) throw new ApiError(404, 'Post not found');

    return Post.find({
        _id: { $ne: postId },
        category: post.category,
        isDeleted: false,
        status: 'published'
    })
        .populate('author', 'name avatar')
        .populate('category', 'name slug')
        .sort({ viewCount: -1 })
        .limit(4);
};

const toggleLike = async (postId, userId) => {
    const post = await Post.findById(postId);
    if (!post) throw new ApiError(404, 'Post not found');

    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
        // Unlike
        post.likes.splice(likeIndex, 1);
    } else {
        // Like
        post.likes.push(userId);
    }

    await post.save();
    return { liked: likeIndex === -1, likeCount: post.likes.length };
};

const calculateReadingTime = (content) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
};

module.exports = {
    createPost,
    queryPosts,
    getPostBySlug,
    updatePostById,
    deletePostById,
    getFeaturedPosts,
    getTrendingPosts,
    searchPosts,
    getRelatedPosts,
    toggleLike,
    calculateReadingTime,
};
