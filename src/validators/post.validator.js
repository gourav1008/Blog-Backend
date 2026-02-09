const Joi = require('joi');

const createPost = {
    body: Joi.object().keys({
        title: Joi.string().required(),
        content: Joi.string().required(),
        excerpt: Joi.string().max(300),
        coverImage: Joi.string().required(),
        category: Joi.string().required(), // MongoDB ID
        tags: Joi.array().items(Joi.string()),
        status: Joi.string().valid('draft', 'published', 'scheduled'),
        seo: Joi.object().keys({
            title: Joi.string(),
            description: Joi.string(),
            keywords: Joi.array().items(Joi.string()),
        }),
    }),
};

const updatePost = {
    params: Joi.object().keys({
        postId: Joi.string().required(),
    }),
    body: Joi.object().keys({
        title: Joi.string(),
        content: Joi.string(),
        excerpt: Joi.string().max(300),
        coverImage: Joi.string(),
        category: Joi.string(),
        tags: Joi.array().items(Joi.string()),
        status: Joi.string().valid('draft', 'published', 'scheduled'),
        seo: Joi.object().keys({
            title: Joi.string(),
            description: Joi.string(),
            keywords: Joi.array().items(Joi.string()),
        }),
    }).min(1),
};

module.exports = {
    createPost,
    updatePost,
};
