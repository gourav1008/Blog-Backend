const supabase = require('../lib/supabase');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const getAllTags = catchAsync(async (req, res) => {
    const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');
    if (error) throw new ApiError(500, error.message);
    res.json({ success: true, data });
});

const getTagBySlug = catchAsync(async (req, res) => {
    const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('slug', req.params.slug)
        .single();
    if (error || !data) throw new ApiError(404, 'Tag not found');
    res.json({ success: true, data });
});

const createTag = catchAsync(async (req, res) => {
    const { name, slug } = req.body;
    const { data, error } = await supabase
        .from('tags')
        .insert({ name, slug })
        .select()
        .single();
    if (error) throw new ApiError(400, error.message);
    res.status(201).json({ success: true, data });
});

const updateTag = catchAsync(async (req, res) => {
    const { data, error } = await supabase
        .from('tags')
        .update(req.body)
        .eq('id', req.params.id)
        .select()
        .single();
    if (error) throw new ApiError(400, error.message);
    res.json({ success: true, data });
});

const deleteTag = catchAsync(async (req, res) => {
    const { error } = await supabase.from('tags').delete().eq('id', req.params.id);
    if (error) throw new ApiError(400, error.message);
    res.status(204).send();
});

module.exports = { getAllTags, getTagBySlug, createTag, updateTag, deleteTag };
