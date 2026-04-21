const supabase = require('../lib/supabase');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const POST_SELECT = `
  id, title, slug, content, excerpt, featured_image, status,
  is_featured, is_premium, is_sponsored, view_count, publish_date,
  author:users!author_id (id, name, email, avatar, bio, role),
  category:categories!category_id (id, name, slug, description)
`;

const getProfile = catchAsync(async (req, res) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', req.user.id)
        .single();

    if (error || !data) {
        throw new ApiError(404, 'User not found');
    }

    res.json({ success: true, data });
});

const updateProfile = catchAsync(async (req, res) => {
    const { name, bio, avatar } = req.body;
    const { data, error } = await supabase
        .from('users')
        .update({ name, bio, avatar, updated_at: new Date().toISOString() })
        .eq('id', req.user.id)
        .select()
        .single();

    if (error) throw new ApiError(400, error.message);
    res.json({ success: true, data });
});

const getBookmarks = catchAsync(async (req, res) => {
    const { data, error } = await supabase
        .from('bookmarks')
        .select(`post:${POST_SELECT}`)
        .eq('user_id', req.user.id);

    if (error) throw new ApiError(500, error.message);
    res.json({ success: true, data: data.map(b => b.post) });
});

const addBookmark = catchAsync(async (req, res) => {
    const { postId } = req.params;
    const { error } = await supabase
        .from('bookmarks')
        .insert({ user_id: req.user.id, post_id: postId });

    if (error && error.code !== '23505') throw new ApiError(400, error.message);
    res.json({ success: true, message: 'Post bookmarked successfully', bookmarked: true });
});

const removeBookmark = catchAsync(async (req, res) => {
    const { postId } = req.params;
    const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', req.user.id)
        .eq('post_id', postId);

    if (error) throw new ApiError(400, error.message);
    res.json({ success: true, message: 'Bookmark removed successfully', bookmarked: false });
});

const getUserPosts = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { data, error } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .eq('author_id', userId)
        .eq('is_deleted', false)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

    if (error) throw new ApiError(500, error.message);
    res.json({ success: true, data });
});

const getUserComments = catchAsync(async (req, res) => {
    const { data, error } = await supabase
        .from('comments')
        .select(`
            id, content, created_at,
            post:posts!post_id (id, title, slug)
        `)
        .eq('user_id', req.user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (error) throw new ApiError(500, error.message);
    res.json({ success: true, data });
});

const getLikedPosts = catchAsync(async (req, res) => {
    const { data, error } = await supabase
        .from('likes')
        .select(`post:${POST_SELECT}`)
        .eq('user_id', req.user.id);

    if (error) throw new ApiError(500, error.message);
    res.json({ success: true, data: data.map(l => l.post) });
});

const banUser = catchAsync(async (req, res) => {
    const { userId } = req.params;
    // Get current status
    const { data: user } = await supabase.from('users').select('is_banned').eq('id', userId).single();
    if (!user) throw new ApiError(404, 'User not found');

    const { error } = await supabase
        .from('users')
        .update({ is_banned: !user.is_banned })
        .eq('id', userId);

    if (error) throw new ApiError(400, error.message);
    res.json({ success: true, message: `User ${!user.is_banned ? 'banned' : 'unbanned'} successfully` });
});

const getAllUsers = catchAsync(async (req, res) => {
    const { role, page = 1, limit = 20 } = req.query;
    let query = supabase.from('users').select('*', { count: 'exact' });

    if (role) query = query.eq('role', role);

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw new ApiError(500, error.message);

    res.json({
        success: true,
        data,
        pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil((count || 0) / limit)
        }
    });
});

const updateUserRole = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    const { data, error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId)
        .select()
        .single();

    if (error) throw new ApiError(400, error.message);
    res.json({ success: true, data, message: 'User role updated successfully' });
});

module.exports = {
    getProfile,
    updateProfile,
    getBookmarks,
    addBookmark,
    removeBookmark,
    getUserPosts,
    getUserComments,
    getLikedPosts,
    banUser,
    getAllUsers,
    updateUserRole,
};
