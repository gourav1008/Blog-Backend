const express = require('express');
const multer = require('multer');
const { auth } = require('../../middleware/auth');
const uploadController = require('../../controllers/upload.controller');
const ApiError = require('../../utils/ApiError');

const router = express.Router();

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new ApiError(400, 'Only image files are allowed!'), false);
        }
    },
});

router.post('/image', auth, upload.single('image'), uploadController.uploadSingle);

module.exports = router;
