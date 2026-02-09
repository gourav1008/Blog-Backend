const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { uploadImage } = require('../utils/cloudinary');

const uploadSingle = catchAsync(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, 'Please upload a file');
    }

    const { folder = 'general' } = req.body;
    const result = await uploadImage(req.file.buffer, folder);

    res.status(200).json({
        data: {
            url: result.secure_url,
            publicId: result.public_id,
            originalName: req.file.originalname,
            format: result.format,
            size: result.bytes
        }
    });
});

module.exports = {
    uploadSingle,
};
