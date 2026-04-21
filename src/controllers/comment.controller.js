const supabase = require('../lib/supabase');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const getCommentsByPost = catchAsync(async (req, res) => {
    const { data, error } = await supabase
        .from('comments')
        .select(`
            id, content, is_edited, created_at, updated_at, parent_comment_id,
            author:users!user_id (id, name, avatar)
        `)
        .eq('post_id', req.params.postId)
        .eq('is_deleted', false)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: true });

    if (error) throw new ApiError(500, error.message);

    // Fetch replies for each top-level comment
    const withReplies = await Promise.all(
        (data || []).map(async (comment) => {
            const { data: replies } = await supabase
                .from('comments')
                .select('id, content, is_edited, created_at, author:users!user_id (id, name, avatar)')
                .eq('parent_comment_id', comment.id)
                .eq('is_deleted', false)
                .order('created_at', { ascending: true });
            return { ...comment, replies: replies || [] };
        })
    );

    res.json({ success: true, data: withReplies });
});

const createComment = catchAsync(async (req, res) => {
    const { content, parentId } = req.body;
    const { postId } = req.params;

    const { data, error } = await supabase
        .from('comments')
        .insert({
            post_id: postId,
            user_id: req.user.id,
            content,
            parent_comment_id: parentId || null,
        })
        .select(`id, content, created_at, author:users!user_id (id, name, avatar)`)
        .single();

    if (error) throw new ApiError(400, error.message);
    res.status(201).json({ success: true, data });
});

const updateComment = catchAsync(async (req, res) => {
    const { data: existing } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', req.params.commentId)
        .single();

    if (!existing) throw new ApiError(404, 'Comment not found');
    if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
        throw new ApiError(403, 'You cannot edit this comment');
    }

    const { data, error } = await supabase
        .from('comments')
        .update({ content: req.body.content, is_edited: true })
        .eq('id', req.params.commentId)
        .select()
        .single();

    if (error) throw new ApiError(400, error.message);
    res.json({ success: true, data });
});

const deleteComment = catchAsync(async (req, res) => {
    const { data: existing } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', req.params.commentId)
        .single();

    if (!existing) throw new ApiError(404, 'Comment not found');
    if (existing.user_id !== req.user.id && !['admin', 'editor'].includes(req.user.role)) {
        throw new ApiError(403, 'You cannot delete this comment');
    }

    await supabase.from('comments').update({ is_deleted: true }).eq('id', req.params.commentId);
    res.status(204).send();
});

module.exports = { getCommentsByPost, createComment, updateComment, deleteComment };
