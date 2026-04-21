const supabase = require('../lib/supabase');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const POST_SELECT = `
  id, title, slug, excerpt, status, is_featured, view_count, created_at,
  author:users!author_id (id, name, avatar),
  category:categories!category_id (id, name)
`;

/**
 * Get aggregate statistics for the admin dashboard
 */
const getDashboardStats = catchAsync(async (req, res) => {
    const [
        { count: totalUsers },
        { count: totalPosts },
        { count: totalComments },
        { count: totalSubscribers },
        { count: publishedPosts },
        { count: draftPosts }
    ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
        supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'published').eq('is_deleted', false),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'draft').eq('is_deleted', false)
    ]);

    // Recent Activity
    const [ { data: recentPosts }, { data: recentUsers } ] = await Promise.all([
        supabase.from('posts').select(POST_SELECT).eq('is_deleted', false).order('created_at', { ascending: false }).limit(5),
        supabase.from('users').select('id, name, email, avatar, role, created_at').order('created_at', { ascending: false }).limit(5)
    ]);

    // Views calculation (Sum of all post views)
    const { data: viewData } = await supabase.from('posts').select('view_count').eq('is_deleted', false);
    const totalViews = (viewData || []).reduce((acc, p) => acc + (p.view_count || 0), 0);

    // Category distribution
    const { data: posts } = await supabase.from('posts').select('category_id').eq('is_deleted', false);
    const catMap = {};
    (posts || []).forEach(p => catMap[p.category_id] = (catMap[p.category_id] || 0) + 1);
    
    const { data: categories } = await supabase.from('categories').select('id, name');
    const categoryStats = (categories || []).map(c => ({
        name: c.name,
        count: catMap[c.id] || 0
    })).sort((a, b) => b.count - a.count);

    res.json({
        success: true,
        data: {
            overview: {
                totalUsers,
                totalPosts,
                totalViews,
                totalComments,
                totalSubscribers,
                publishedPosts,
                draftPosts
            },
            recentActivity: {
                recentPosts,
                recentUsers
            },
            popularCategories: categoryStats
        }
    });
});

/**
 * User Management
 */
const getAllUsers = catchAsync(async (req, res) => {
    const { page = 1, limit = 20, role, search } = req.query;
    let query = supabase.from('users').select('*', { count: 'exact' });

    if (role) query = query.eq('role', role);
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);

    if (error) throw new ApiError(500, error.message);
    res.json({ success: true, data: { users: data, pagination: { total: count, page, limit, totalPages: Math.ceil((count || 0) / limit) } } });
});

const updateUser = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { data, error } = await supabase.from('users').update(req.body).eq('id', userId).select().single();
    if (error) throw new ApiError(400, error.message);
    res.json({ success: true, data, message: 'User updated successfully' });
});

const deleteUser = catchAsync(async (req, res) => {
    const { userId } = req.params;
    // We use the service role key to delete from auth.users (if possible) or just delete from public.users
    // For now, let's just delete from public.users and mark posts as deleted
    await supabase.from('users').delete().eq('id', userId);
    await supabase.from('posts').update({ is_deleted: true }).eq('author_id', userId);
    res.status(204).send();
});

/**
 * Comment Moderation
 */
const getAllComments = catchAsync(async (req, res) => {
    const { page = 1, limit = 20, postId } = req.query;
    let query = supabase.from('comments').select(`
        id, content, created_at,
        author:users!user_id (id, name, avatar, email),
        post:posts!post_id (id, title, slug)
    `, { count: 'exact' }).eq('is_deleted', false);

    if (postId) query = query.eq('post_id', postId);

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);

    if (error) throw new ApiError(500, error.message);
    res.json({ success: true, data: { comments: data, pagination: { total: count, page, limit, totalPages: Math.ceil((count || 0) / limit) } } });
});

const deleteComment = catchAsync(async (req, res) => {
    await supabase.from('comments').update({ is_deleted: true }).eq('id', req.params.commentId);
    res.status(204).send();
});

/**
 * Post Management
 */
const getAllPosts = catchAsync(async (req, res) => {
    const { page = 1, limit = 10, status, category, search } = req.query;
    let query = supabase.from('posts').select(POST_SELECT, { count: 'exact' }).eq('is_deleted', false);

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category_id', category);
    if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);

    if (error) throw new ApiError(500, error.message);
    res.json({ success: true, data: { posts: data, pagination: { total: count, page, limit, totalPages: Math.ceil((count || 0) / limit) } } });
});

const getPostById = catchAsync(async (req, res) => {
    const { data, error } = await supabase.from('posts').select(POST_SELECT).eq('id', req.params.postId).single();
    if (error || !data) throw new ApiError(404, 'Post not found');
    res.json({ success: true, data });
});

// Post creation/update is usually handled in post.controller, but mirrored here for admin routes if needed
const createPost = catchAsync(async (req, res) => {
    const { data, error } = await supabase.from('posts').insert({ ...req.body, author_id: req.user.id }).select().single();
    if (error) throw new ApiError(400, error.message);
    res.status(201).json({ success: true, data });
});

const updatePost = catchAsync(async (req, res) => {
    const { data, error } = await supabase.from('posts').update(req.body).eq('id', req.params.postId).select().single();
    if (error) throw new ApiError(400, error.message);
    res.json({ success: true, data });
});

const deletePost = catchAsync(async (req, res) => {
    await supabase.from('posts').update({ is_deleted: true }).eq('id', req.params.postId);
    res.status(204).send();
});

const getAllCategories = catchAsync(async (req, res) => {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) throw new ApiError(500, error.message);
    res.json({ success: true, data: { categories: data } });
});

const createCategory = catchAsync(async (req, res) => {
    const { data, error } = await supabase.from('categories').insert(req.body).select().single();
    if (error) throw new ApiError(400, error.message);
    res.status(201).json({ success: true, data });
});

const updateCategory = catchAsync(async (req, res) => {
    const { data, error } = await supabase.from('categories').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw new ApiError(400, error.message);
    res.json({ success: true, data });
});

const deleteCategory = catchAsync(async (req, res) => {
    await supabase.from('categories').delete().eq('id', req.params.id);
    res.status(204).send();
});

const getAllTags = catchAsync(async (req, res) => {
    const { data, error } = await supabase.from('tags').select('*').order('name');
    if (error) throw new ApiError(500, error.message);
    res.json({ success: true, data: { tags: data } });
});

const createTag = catchAsync(async (req, res) => {
    const { data, error } = await supabase.from('tags').insert(req.body).select().single();
    if (error) throw new ApiError(400, error.message);
    res.status(201).json({ success: true, data });
});

const updateTag = catchAsync(async (req, res) => {
    const { data, error } = await supabase.from('tags').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw new ApiError(400, error.message);
    res.json({ success: true, data });
});

const deleteTag = catchAsync(async (req, res) => {
    await supabase.from('tags').delete().eq('id', req.params.id);
    res.status(204).send();
});

module.exports = {
    getDashboardStats,
    getAllUsers,
    updateUser,
    deleteUser,
    getAllComments,
    deleteComment,
    getAllPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getAllTags,
    createTag,
    updateTag,
    deleteTag,
};
