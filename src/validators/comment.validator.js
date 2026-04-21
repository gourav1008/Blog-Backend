const Joi = require('joi');

const createComment = {
    body: Joi.object().keys({
        postId: Joi.string().uuid().required(),
        content: Joi.string().required().trim().min(1).max(1000),
        parentId: Joi.string().uuid().allow(null),
    }),
};

const deleteComment = {
    params: Joi.object().keys({
        commentId: Joi.string().uuid().required(),
    }),
};

module.exports = {
    createComment,
    deleteComment,
};
