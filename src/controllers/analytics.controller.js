const { Analytics, Subscriber } = require('../models/Subscriber');
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const { Category } = require('../models/Category');
const catchAsync = require('../utils/catchAsync');

const getPostStats = catchAsync(async (req, res) => {
    const stats = await Analytics.find({ post: req.params.postId }).sort({ date: -1 });
    res.send(stats);
});

const getTrendingPosts = catchAsync(async (req, res) => {
    // Simple trending logic: posts with most views in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trending = await Analytics.aggregate([
        { $match: { date: { $gte: sevenDaysAgo } } },
        { $group: { _id: '$post', totalViews: { $sum: '$views' } } },
        { $sort: { totalViews: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'posts', localField: '_id', foreignField: '_id', as: 'post' } },
        { $unwind: '$post' }
    ]);

    res.send(trending);
});

const getDashboardStats = catchAsync(async (req, res) => {
    // Get overall platform stats
    const [
        totalPosts,
        totalUsers,
        totalComments,
        totalSubscribers,
        publishedPosts,
        draftPosts
    ] = await Promise.all([
        Post.countDocuments({ isDeleted: false }),
        User.countDocuments(),
        Comment.countDocuments({ isDeleted: false }),
        Subscriber.countDocuments({ isActive: true }),
        Post.countDocuments({ isDeleted: false, status: 'published' }),
        Post.countDocuments({ isDeleted: false, status: 'draft' })
    ]);

    // Get total views from all posts
    const totalViews = await Post.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$viewCount' } } }
    ]);

    // Get popular categories
    const popularCategories = await Post.aggregate([
        { $match: { isDeleted: false, status: 'published' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
        { $unwind: '$category' },
        { $project: { name: '$category.name', count: 1 } }
    ]);

    // Recent activity - last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentPosts = await Post.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
        isDeleted: false
    });

    const recentComments = await Comment.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
        isDeleted: false
    });

    const recentSubscribers = await Subscriber.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
    });

    res.send({
        data: {
            overview: {
                totalPosts,
                totalUsers,
                totalComments,
                totalSubscribers,
                totalViews: totalViews[0]?.total || 0,
                publishedPosts,
                draftPosts
            },
            recentActivity: {
                newPostsLast7Days: recentPosts,
                newCommentsLast7Days: recentComments,
                newSubscribersLast7Days: recentSubscribers
            },
            popularCategories
        }
    });
});

module.exports = {
    getPostStats,
    getTrendingPosts,
    getDashboardStats,
};
