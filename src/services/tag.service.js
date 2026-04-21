const supabase = require('../lib/supabase');
const ApiError = require('../utils/ApiError');

const getAllTags = async () => {
    const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');
    if (error) throw new ApiError(500, error.message);
    return data;
};

const getTagBySlug = async (slug) => {
    const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('slug', slug)
        .single();
    if (error || !data) throw new ApiError(404, 'Tag not found');
    return data;
};

const getTagById = async (id) => {
    const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('id', id)
        .single();
    if (error || !data) throw new ApiError(404, 'Tag not found');
    return data;
};

const createTag = async (body) => {
    const { data, error } = await supabase
        .from('tags')
        .insert(body)
        .select()
        .single();
    if (error) throw new ApiError(400, error.message);
    return data;
};

const updateTag = async (id, body) => {
    const { data, error } = await supabase
        .from('tags')
        .update(body)
        .eq('id', id)
        .select()
        .single();
    if (error) throw new ApiError(400, error.message);
    return data;
};

const deleteTag = async (id) => {
    const { error } = await supabase.from('tags').delete().eq('id', id);
    if (error) throw new ApiError(400, error.message);
};

module.exports = { createTag, getAllTags, getTagBySlug, getTagById, updateTag, deleteTag };
