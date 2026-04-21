const supabase = require('../lib/supabase');
const ApiError = require('../utils/ApiError');

/**
 * Build the common post SELECT with related data
 */
const POST_SELECT = `
  id, title, slug, content, excerpt, featured_image, status,
  is_featured, is_premium, is_sponsored, view_count, publish_date,
  seo_title, seo_description, seo_keywords, created_at, updated_at,
  author:users!author_id (id, name, email, avatar, bio, role),
  category:categories!category_id (id, name, slug, description),
  tags:post_tags (
    tag:tags (id, name, slug)
  )
`;

/**
 * Query posts with filtering, sorting, pagination, and search.
 */
async function queryPosts({ status = 'published', categorySlug, tagSlug, authorId, search, sortBy = 'latest', page = 1, limit = 10, isAdmin = false } = {}) {
    let query = supabase
        .from('posts')
        .select(POST_SELECT, { count: 'exact' })
        .eq('is_deleted', false);

    // Status filter (admin can see all)
    if (!isAdmin) {
        query = query.eq('status', 'published');
    } else if (status) {
        query = query.eq('status', status);
    }

    // Category filter
    if (categorySlug) {
        const { data: cat } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', categorySlug)
            .single();
        if (cat) query = query.eq('category_id', cat.id);
    }

    // Author filter
    if (authorId) query = query.eq('author_id', authorId);

    // Full-text search
    if (search) {
        query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }

    // Sorting
    switch (sortBy) {
        case 'popular':
            query = query.order('view_count', { ascending: false });
            break;
        case 'oldest':
            query = query.order('created_at', { ascending: true });
            break;
        default: // 'latest'
            query = query.order('created_at', { ascending: false });
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: posts, error, count } = await query;

    if (error) throw new ApiError(500, error.message);

    // Flatten post_tags → tags array
    const normalized = (posts || []).map(flattenPost);

    return {
        posts: normalized,
        total: count ?? 0,
        page,
        totalPages: Math.ceil((count ?? 0) / limit),
        hasMore: (page * limit) < (count ?? 0),
    };
}

/**
 * Get a single post by slug and increment view count
 */
async function getPostBySlug(slug) {
    const { data: post, error } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .eq('slug', slug)
        .eq('is_deleted', false)
        .single();

    if (error || !post) throw new ApiError(404, 'Post not found');

    // Increment views (fire-and-forget)
    supabase.from('posts')
        .update({ view_count: (post.view_count || 0) + 1 })
        .eq('id', post.id)
        .then(() => {});

    return flattenPost(post);
}

/**
 * Create a post
 */
async function createPost(data) {
    const { tags = [], ...postData } = data;

    const { data: post, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

    if (error) throw new ApiError(400, error.message);

    // Insert post_tags
    if (tags.length > 0) {
        await supabase.from('post_tags').insert(
            tags.map((tag_id) => ({ post_id: post.id, tag_id }))
        );
    }

    return post;
}

/**
 * Update a post by ID
 */
async function updatePost(postId, updateData, user) {
    const { tags, ...fieldsToUpdate } = updateData;

    // Ensure user is author or admin/editor
    const { data: existing } = await supabase
        .from('posts')
        .select('author_id')
        .eq('id', postId)
        .single();

    if (!existing) throw new ApiError(404, 'Post not found');
    if (existing.author_id !== user.id && !['admin', 'editor'].includes(user.role)) {
        throw new ApiError(403, 'You do not have permission to edit this post');
    }

    const { data: post, error } = await supabase
        .from('posts')
        .update({ ...fieldsToUpdate, updated_at: new Date().toISOString() })
        .eq('id', postId)
        .select()
        .single();

    if (error) throw new ApiError(400, error.message);

    // Replace post_tags
    if (tags !== undefined) {
        await supabase.from('post_tags').delete().eq('post_id', postId);
        if (tags.length > 0) {
            await supabase.from('post_tags').insert(
                tags.map((tag_id) => ({ post_id: postId, tag_id }))
            );
        }
    }

    return post;
}

/**
 * Soft-delete a post
 */
async function deletePost(postId, user) {
    const { data: existing } = await supabase
        .from('posts')
        .select('author_id')
        .eq('id', postId)
        .single();

    if (!existing) throw new ApiError(404, 'Post not found');
    if (existing.author_id !== user.id && user.role !== 'admin') {
        throw new ApiError(403, 'You do not have permission to delete this post');
    }

    const { error } = await supabase
        .from('posts')
        .update({ is_deleted: true })
        .eq('id', postId);

    if (error) throw new ApiError(400, error.message);
}

/**
 * Toggle like on a post
 */
async function likePost(postId, userId) {
    const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: userId });
    if (error && error.code !== '23505') throw new ApiError(400, error.message); // ignore duplicate
    const { count } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', postId);
    return { liked: true, count };
}

async function unlikePost(postId, userId) {
    await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId);
    const { count } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', postId);
    return { liked: false, count };
}

/**
 * Get featured posts
 */
async function getFeaturedPosts(limit = 6) {
    const { data, error } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .eq('status', 'published')
        .eq('is_featured', true)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw new ApiError(500, error.message);
    return (data || []).map(flattenPost);
}

/**
 * Get trending posts (most views in last 30 days)
 */
async function getTrendingPosts(limit = 6) {
    const { data, error } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .eq('status', 'published')
        .eq('is_deleted', false)
        .order('view_count', { ascending: false })
        .limit(limit);

    if (error) throw new ApiError(500, error.message);
    return (data || []).map(flattenPost);
}

/**
 * Normalize the nested Supabase join structure
 */
function flattenPost(post) {
    if (!post) return post;
    return {
        ...post,
        tags: (post.tags || []).map((t) => t.tag).filter(Boolean),
    };
}

/**
 * Get a single post by ID
 */
async function getPostById(postId) {
    const { data: post, error } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .eq('id', postId)
        .eq('is_deleted', false)
        .single();

    if (error || !post) throw new ApiError(404, 'Post not found');
    return flattenPost(post);
}

/**
 * Get related posts (same category or tags)
 */
async function getRelatedPosts(postId, limit = 4) {
    const { data: post } = await supabase
        .from('posts')
        .select('category_id')
        .eq('id', postId)
        .single();

    if (!post) return [];

    const { data: related, error } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .eq('category_id', post.category_id)
        .neq('id', postId)
        .eq('status', 'published')
        .eq('is_deleted', false)
        .limit(limit);

    if (error) throw new ApiError(500, error.message);
    return (related || []).map(flattenPost);
}

/**
 * Get all tags
 */
async function getTags() {
    const { data, error } = await supabase
        .from('tags')
        .select('id, name, slug')
        .order('name');
    if (error) throw new ApiError(500, error.message);
    return data;
}

module.exports = {
    queryPosts,
    getPostBySlug,
    getPostById,
    getRelatedPosts,
    getTags,
    createPost,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    getFeaturedPosts,
    getTrendingPosts,
};
