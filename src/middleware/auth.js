const supabase = require('../lib/supabase');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

/**
 * Middleware: verifies the Clerk JWT attached by ClerkExpressWithAuth.
 * Attaches `req.user` with the public profile from Supabase.
 */
const protect = catchAsync(async (req, res, next) => {
    // req.auth is populated by ClerkExpressWithAuth middleware
    if (!req.auth || !req.auth.userId) {
        throw new ApiError(401, 'Unauthorized: Missing or invalid authentication token');
    }

    const { userId } = req.auth;

    // Fetch profile from Supabase using Service Role (configured in lib/supabase)
    const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !profile) {
        // If profile doesn't exist, we might be in a race condition or the user isn't synced.
        // For security, we reject unless we want to allow JIT provisioning here.
        throw new ApiError(403, 'User profile not found. Please ensure you are registered.');
    }

    if (profile.is_banned) {
        throw new ApiError(403, 'Your account has been suspended.');
    }

    req.user = profile;
    next();
});

/**
 * Authorization middleware — restrict to given roles
 * Usage: authorize('admin', 'editor')
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError(401, 'Authentication required'));
        }
        if (!roles.includes(req.user.role)) {
            return next(new ApiError(403, 'Access denied: insufficient permissions'));
        }
        next();
    };
};

module.exports = { protect, authorize };
