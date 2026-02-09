const express = require('express');
const newsletterController = require('../../controllers/newsletter.controller');

const router = express.Router();

router.post('/subscribe', newsletterController.subscribe);
router.post('/unsubscribe', newsletterController.unsubscribe);

module.exports = router;
