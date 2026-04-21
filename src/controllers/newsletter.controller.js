const supabase = require('../lib/supabase');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const nodemailer = require('nodemailer');

const subscribe = catchAsync(async (req, res) => {
    const { email, source = 'unknown' } = req.body;

    // Check if exists
    const { data: existing } = await supabase
        .from('subscribers')
        .select('*')
        .eq('email', email)
        .single();

    if (existing) {
        if (existing.is_active) {
            throw new ApiError(400, 'Already subscribed');
        }
        await supabase.from('subscribers').update({ is_active: true, source }).eq('email', email);
    } else {
        await supabase.from('subscribers').insert({ email, source });
    }

    // Send welcome email (optional)
    try {
        if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
            });

            await transporter.sendMail({
                from: '"Blog Platform" <newsletter@example.com>',
                to: email,
                subject: "Welcome to our Newsletter!",
                text: "Thank you for subscribing to our blog updates.",
            });
        }
    } catch (emailError) {
        console.error('Email sending failed:', emailError.message);
    }

    res.status(201).json({ success: true, message: 'Subscribed successfully' });
});

const unsubscribe = catchAsync(async (req, res) => {
    const { email } = req.body;
    await supabase.from('subscribers').update({ is_active: false }).eq('email', email);
    res.json({ success: true, message: 'Unsubscribed successfully' });
});

const getAllSubscribers = catchAsync(async (req, res) => {
    const { page = 1, limit = 50, active } = req.query;
    let query = supabase.from('subscribers').select('*', { count: 'exact' });

    if (active !== undefined) query = query.eq('is_active', active === 'true');

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);

    if (error) throw new ApiError(500, error.message);

    res.json({
        success: true,
        data,
        pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil((count || 0) / limit)
        }
    });
});

module.exports = {
    subscribe,
    unsubscribe,
    getAllSubscribers,
};
