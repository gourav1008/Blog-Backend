const Joi = require('joi');

const createCategory = {
    body: Joi.object().keys({
        name: Joi.string().required().trim(),
        description: Joi.string().allow('', null).trim(),
    }),
};

const updateCategory = {
    params: Joi.object().keys({
        categoryId: Joi.string().uuid().required(),
    }),
    body: Joi.object().keys({
        name: Joi.string().trim(),
        description: Joi.string().allow('', null).trim(),
    }).min(1),
};

const deleteCategory = {
    params: Joi.object().keys({
        categoryId: Joi.string().uuid().required(),
    }),
};

module.exports = {
    createCategory,
    updateCategory,
    deleteCategory,
};
