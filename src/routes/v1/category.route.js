const express = require('express');
const { auth, authorize } = require('../../middleware/auth');
const { Category, Tag } = require('../../models/Category');
const catchAsync = require('../../utils/catchAsync');
const { slugify } = require('../../utils/slugify');

const router = express.Router();

router.get('/', catchAsync(async (req, res) => {
    const categories = await Category.find();
    res.send({ data: categories });
}));

router.post('/', auth, authorize('admin'), catchAsync(async (req, res) => {
    const { name, description } = req.body;
    const category = await Category.create({ name, description, slug: slugify(name) });
    res.status(201).send({ data: category });
}));

router.get('/slug/:slug', catchAsync(async (req, res) => {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) return res.status(404).send({ message: 'Category not found' });
    res.send({ data: category });
}));

router.delete('/:id', auth, authorize('admin'), catchAsync(async (req, res) => {
    await Category.findByIdAndDelete(req.params.id);
    res.send({ message: 'Category deleted successfully' });
}));

router.get('/tags', catchAsync(async (req, res) => {
    const tags = await Tag.find();
    res.send({ data: tags });
}));

router.post('/tags', auth, authorize('admin', 'editor'), catchAsync(async (req, res) => {
    const { name } = req.body;
    const tag = await Tag.create({ name, slug: slugify(name) });
    res.status(201).send({ data: tag });
}));

router.get('/tags/slug/:slug', catchAsync(async (req, res) => {
    const tag = await Tag.findOne({ slug: req.params.slug });
    if (!tag) return res.status(404).send({ message: 'Tag not found' });
    res.send({ data: tag });
}));

module.exports = router;
