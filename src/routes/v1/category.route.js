const express = require('express');
const { protect, authorize } = require('../../middleware/auth');
const categoryController = require('../../controllers/category.controller');
const validate = require('../../middleware/validate');
const categoryValidator = require('../../validators/category.validator');

const router = express.Router();

router
    .route('/')
    .get(categoryController.getCategories)
    .post(protect, authorize('admin'), validate(categoryValidator.createCategory), categoryController.createCategory);

router
    .route('/:categoryId')
    .get(categoryController.getCategory)
    .patch(protect, authorize('admin'), validate(categoryValidator.updateCategory), categoryController.updateCategory)
    .delete(protect, authorize('admin'), validate(categoryValidator.deleteCategory), categoryController.deleteCategory);

module.exports = router;
