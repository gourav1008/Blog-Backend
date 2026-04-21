const supabase = require('../lib/supabase');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const getCategories = catchAsync(async (req, res) => {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
    if (error) throw new ApiError(500, error.message);
    res.json({ success: true, data });
});

const getCategory = catchAsync(async (req, res) => {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', req.params.categoryId)
        .single();
    if (error || !data) throw new ApiError(404, 'Category not found');
    res.json({ success: true, data });
});

const getCategoryBySlug = catchAsync(async (req, res) => {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', req.params.slug)
        .single();
    if (error || !data) throw new ApiError(404, 'Category not found');
    res.json({ success: true, data });
});

const createCategory = catchAsync(async (req, res) => {
    const { name, slug, description } = req.body;
    const { data, error } = await supabase
        .from('categories')
        .insert({ name, slug, description })
        .select()
        .single();
    if (error) throw new ApiError(400, error.message);
    res.status(201).json({ success: true, data });
});

const updateCategory = catchAsync(async (req, res) => {
    const { data, error } = await supabase
        .from('categories')
        .update(req.body)
        .eq('id', req.params.categoryId)
        .select()
        .single();
    if (error) throw new ApiError(400, error.message);
    res.json({ success: true, data });
});

const deleteCategory = catchAsync(async (req, res) => {
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', req.params.categoryId);
    if (error) throw new ApiError(400, error.message);
    res.status(204).send();
});

module.exports = { getCategories, getCategory, getCategoryBySlug, createCategory, updateCategory, deleteCategory };
