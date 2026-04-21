const supabase = require('../lib/supabase');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

const getPostStats = catchAsync(async (req, res) => {
    // In our simplified Supabase schema, we don't have a separate analytics table for daily views yet.
    // However, we can return the current view_count and potentially recent comments as a proxy.
    const { data: post, error } = await supabase
        .from('posts')
        .select('view_count, created_at')
        .eq('id', req.params.postId)
        .single();
    
    if (error) throw new ApiError(500, error.message);
    res.json({ success: true, data: { views: post.view_count, date: post.created_at } });
});

const getTrendingPosts = catchAsync(async (req, res) => {
    // Trending = most views overall (simplified from 7-day trend due to lack of daily logs)
    const { data, error } = await supabase
        .from('posts')
        .select('id, title, slug, view_count, featured_image, excerpt')
        .eq('status', 'published')
        .eq('is_deleted', false)
        .order('view_count', { ascending: false })
        .limit(5);

    if (error) throw new ApiError(500, error.message);
    res.json({ success: true, data });
});

const getDashboardStats = catchAsync(async (req, res) => {
    const [
        { count: totalPosts },
        { count: totalUsers },
        { count: totalComments },
        { count: totalSubscribers },
        { count: publishedPosts },
        { count: draftPosts }
    ] = await Promise.all([
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
        supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('is_deleted', false, 'status', 'published'),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('is_deleted', false, 'status', 'draft')
    ]);

    const { data: viewData } = await supabase.from('posts').select('view_count').eq('is_deleted', false);
    const totalViews = (viewData || []).reduce((acc, p) => acc + (p.view_count || 0), 0);

    // Recent activity - last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString();

    const [
        { count: recentPosts },
        { count: recentComments },
        { count: recentSubscribers }
    ] = await Promise.all([
        supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', dateStr).eq('is_deleted', false),
        supabase.from('comments').select('*', { count: 'exact', head: true }).gte('created_at', dateStr).eq('is_deleted', false),
        supabase.from('subscribers').select('*', { count: 'exact', head: true }).gte('created_at', dateStr)
    ]);

    res.json({
        success: true,
        data: {
            overview: {
                totalPosts,
                totalUsers,
                totalComments,
                totalSubscribers,
                totalViews,
                publishedPosts,
                draftPosts
            },
            recentActivity: {
                newPostsLast7Days: recentPosts,
                newCommentsLast7Days: recentComments,
                newSubscribersLast7Days: recentSubscribers
            }
        }
    });
});

module.exports = {
    getPostStats,
    getTrendingPosts,
    getDashboardStats,
};
