const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokens');

const register = catchAsync(async (req, res) => {
    const { email, password, name } = req.body;

    if (await User.findOne({ email })) {
        throw new ApiError(400, 'Email already taken');
    }

    const user = await User.create({ email, password, name });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    user.password = undefined;
    res.status(201).json({
        data: {
            user,
            tokens: {
                access: accessToken,
                refresh: refreshToken
            }
        }
    });
});

const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password, user.password))) {
        throw new ApiError(401, 'Incorrect email or password');
    }

    if (user.isBanned) {
        throw new ApiError(403, 'Your account has been banned');
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    user.password = undefined;
    res.status(200).json({
        data: {
            user,
            tokens: {
                access: accessToken,
                refresh: refreshToken
            }
        }
    });
});

const logout = catchAsync(async (req, res) => {
    const user = await User.findById(req.user.id);
    user.refreshToken = null;
    await user.save();

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(204).send();
});

const refresh = catchAsync(async (req, res) => {
    let token;
    if (req.cookies.refreshToken) {
        token = req.cookies.refreshToken;
    } else if (req.body.refreshToken) {
        token = req.body.refreshToken;
    }

    if (!token) {
        throw new ApiError(401, 'Please authenticate');
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
        throw new ApiError(401, 'Please authenticate');
    }

    const accessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.cookie('refreshToken', newRefreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    res.send({
        data: {
            tokens: {
                access: accessToken,
                refresh: newRefreshToken
            }
        }
    });
});

module.exports = {
    register,
    login,
    logout,
    refresh,
};
