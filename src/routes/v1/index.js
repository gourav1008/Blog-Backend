const express = require('express');
const authRoute = require('./auth.route');
const postRoute = require('./post.route');
const categoryRoute = require('./category.route');
const userRoute = require('./user.route');
const commentRoute = require('./comment.route');
const newsletterRoute = require('./newsletter.route');
const analyticsRoute = require('./analytics.route');
const uploadRoute = require('./upload.route');

const router = express.Router();

router.use('/auth', authRoute);
router.use('/posts', postRoute);
router.use('/users', userRoute);
router.use('/comments', commentRoute);
router.use('/newsletter', newsletterRoute);
router.use('/analytics', analyticsRoute);
router.use('/categories', categoryRoute);
router.use('/upload', uploadRoute);

module.exports = router;
