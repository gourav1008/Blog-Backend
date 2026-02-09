const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/tokens');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');

const auth = catchAsync(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        throw new ApiError(401, 'Please authenticate');
    }

    try {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.id);

        if (!user) {
            throw new ApiError(401, 'User not found');
        }

        if (user.isBanned) {
            throw new ApiError(403, 'Your account has been banned');
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, 'Please authenticate');
    }
});

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ApiError(403, 'You do not have permission to perform this action'));
        }
        next();
    };
};

module.exports = { auth, authorize };
