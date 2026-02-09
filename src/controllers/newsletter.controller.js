const { Subscriber } = require('../models/Subscriber');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const nodemailer = require('nodemailer');

const subscribe = catchAsync(async (req, res) => {
    const { email, source = 'unknown' } = req.body;

    let subscriber = await Subscriber.findOne({ email });
    if (subscriber) {
        if (subscriber.isActive) {
            throw new ApiError(400, 'Already subscribed');
        }
        subscriber.isActive = true;
        subscriber.source = source;
        await subscriber.save();
    } else {
        subscriber = await Subscriber.create({ email, source });
    }

    // Send welcome email (optional - can fail silently in development)
    try {
        if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
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
        // Don't fail the subscription if email fails
    }

    res.status(201).send({ message: 'Subscribed successfully', data: subscriber });
});

const unsubscribe = catchAsync(async (req, res) => {
    const { email } = req.body;
    const subscriber = await Subscriber.findOne({ email });
    if (subscriber) {
        subscriber.isActive = false;
        await subscriber.save();
    }
    res.send({ message: 'Unsubscribed successfully' });
});

const getAllSubscribers = catchAsync(async (req, res) => {
    const { page = 1, limit = 50, active } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (active !== undefined) filter.isActive = active === 'true';

    const subscribers = await Subscriber.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Subscriber.countDocuments(filter);

    res.send({
        data: subscribers,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
        }
    });
});

module.exports = {
    subscribe,
    unsubscribe,
    getAllSubscribers,
};
