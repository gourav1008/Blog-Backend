const supabase = require('../lib/supabase');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

/**
 * POST /api/v1/auth/register
 */
const register = catchAsync(async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        throw new ApiError(400, 'name, email and password are required');
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: false, // sends verification email
        user_metadata: { name },
    });

    if (error) {
        if (error.message.includes('already registered')) {
            throw new ApiError(400, 'Email already taken');
        }
        throw new ApiError(400, error.message);
    }

    // The trigger `handle_new_user` auto-creates the public.users row
    res.status(201).json({
        success: true,
        message: 'Account created. Please check your email to verify your account.',
        data: {
            user: {
                id: data.user.id,
                email: data.user.email,
                name,
            },
        },
    });
});

/**
 * POST /api/v1/auth/login
 */
const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, 'Email and password are required');
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        throw new ApiError(401, 'Incorrect email or password');
    }

    const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

    if (profileData?.is_banned) {
        throw new ApiError(403, 'Your account has been banned');
    }

    res.cookie('sb-access-token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 3600 * 1000, // 1 hour
    });
    res.cookie('sb-refresh-token', data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 3600 * 1000, // 7 days
    });

    res.status(200).json({
        success: true,
        data: {
            user: profileData,
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at,
            },
        },
    });
});

/**
 * POST /api/v1/auth/logout
 */
const logout = catchAsync(async (req, res) => {
    const token = req.cookies['sb-access-token'];
    if (token) {
        await supabase.auth.admin.signOut(token);
    }
    res.clearCookie('sb-access-token', { path: '/' });
    res.clearCookie('sb-refresh-token', { path: '/' });
    res.status(204).send();
});

/**
 * POST /api/v1/auth/refresh
 */
const refresh = catchAsync(async (req, res) => {
    const refreshToken = req.cookies['sb-refresh-token'] || req.body.refreshToken;
    if (!refreshToken) {
        throw new ApiError(401, 'Please authenticate');
    }

    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

    if (error) {
        throw new ApiError(401, 'Invalid or expired refresh token');
    }

    res.cookie('sb-access-token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 3600 * 1000,
    });

    res.status(200).json({
        success: true,
        data: {
            access_token: data.session.access_token,
            expires_at: data.session.expires_at,
        },
    });
});

/**
 * POST /api/v1/auth/forgot-password
 */
const forgotPassword = catchAsync(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new ApiError(400, 'Email is required');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.CORS_ORIGIN}/reset-password`,
    });

    if (error) throw new ApiError(400, error.message);

    res.json({ success: true, message: 'Password reset link sent to your email' });
});

/**
 * POST /api/v1/auth/reset-password
 */
const resetPassword = catchAsync(async (req, res) => {
    const { access_token, password } = req.body;
    if (!access_token || !password) {
        throw new ApiError(400, 'Access token and new password are required');
    }

    // Use the access token the user got from the reset email link
    const { error } = await supabase.auth.admin.updateUserById(
        // decode user id from token
        (await supabase.auth.getUser(access_token)).data.user?.id ?? '',
        { password }
    );

    if (error) throw new ApiError(400, error.message);

    res.json({ success: true, message: 'Password has been reset successfully' });
});

/**
 * GET /api/v1/auth/verify-email
 */
const verifyEmail = catchAsync(async (req, res) => {
    // Supabase handles email verification automatically via its own flow.
    // This endpoint confirms the redirect is received.
    res.json({ success: true, message: 'Email verified. You can now log in.' });
});

/**
 * GET /api/v1/auth/me
 */
const getMe = catchAsync(async (req, res) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', req.user.id)
        .single();

    if (error || !data) {
        throw new ApiError(404, 'User not found');
    }

    res.json({ success: true, data });
});

module.exports = { register, login, logout, refresh, forgotPassword, resetPassword, verifyEmail, getMe };
