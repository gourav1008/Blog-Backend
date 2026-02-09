const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const getProfile = catchAsync(async (req, res) => {
    const user = await User.findById(req.user.id)
        .populate({
            path: 'bookmarks',
            populate: [
                { path: 'author', select: 'name avatar' },
                { path: 'category', select: 'name slug' }
            ]
        })
        .select('-password');

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.send({ data: user });
});

const updateProfile = catchAsync(async (req, res) => {
    // Prevent updating sensitive fields
    const allowedUpdates = ['name', 'bio', 'avatar'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
            updates[key] = req.body[key];
        }
    });

    const user = await User.findByIdAndUpdate(
        req.user.id,
        updates,
        { new: true, runValidators: true }
    ).select('-password');

    res.send({ data: user });
});

const getBookmarks = catchAsync(async (req, res) => {
    const user = await User.findById(req.user.id).populate({
        path: 'bookmarks',
        match: { isDeleted: false, status: 'published' },
        populate: [
            { path: 'author', select: 'name avatar' },
            { path: 'category', select: 'name slug' }
        ]
    });

    res.send({ data: user.bookmarks });
});

const addBookmark = catchAsync(async (req, res) => {
    const { postId } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(404, 'Post not found');
    }

    // Add bookmark if not already bookmarked
    if (!user.bookmarks.includes(postId)) {
        user.bookmarks.push(postId);
        await user.save();
    }

    res.send({ message: 'Post bookmarked successfully', bookmarked: true });
});

const removeBookmark = catchAsync(async (req, res) => {
    const { postId } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    user.bookmarks = user.bookmarks.filter(id => id.toString() !== postId);
    await user.save();

    res.send({ message: 'Bookmark removed successfully', bookmarked: false });
});

const getUserPosts = catchAsync(async (req, res) => {
    const { userId } = req.params;

    const posts = await Post.find({
        author: userId,
        isDeleted: false,
        status: 'published'
    })
        .populate('author', 'name avatar')
        .populate('category', 'name slug')
        .sort({ createdAt: -1 });

    res.send({ data: posts });
});

const getUserComments = catchAsync(async (req, res) => {
    const comments = await Comment.find({
        author: req.user.id,
        isDeleted: false
    })
        .populate('post', 'title slug')
        .populate('author', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(50);

    res.send({ data: comments });
});

const banUser = catchAsync(async (req, res) => {
    const user = await User.findById(req.params.userId);
    if (!user) throw new ApiError(404, 'User not found');

    user.isBanned = !user.isBanned;
    await user.save();
    res.send({ message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully` });
});

const getAllUsers = catchAsync(async (req, res) => {
    const { page = 1, limit = 20, role } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.send({
        data: users,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
        }
    });
});

const updateUserRole = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'editor', 'admin'].includes(role)) {
        throw new ApiError(400, 'Invalid role');
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true }
    ).select('-password -refreshToken');

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.send({ data: user, message: 'User role updated successfully' });
});

module.exports = {
    getProfile,
    updateProfile,
    getBookmarks,
    addBookmark,
    removeBookmark,
    getUserPosts,
    getUserComments,
    banUser,
    getAllUsers,
    updateUserRole,
};
