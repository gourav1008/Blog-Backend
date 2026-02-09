const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    source: String, // e.g., 'footer', 'popup', 'post-bottom'
}, { timestamps: true });

const analyticsSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    views: {
        type: Number,
        default: 0,
    },
    uniqueVisitors: {
        type: Number,
        default: 0,
    },
    date: {
        type: Date,
        required: true,
    },
}, { timestamps: true });

// Index for quick querying by date and post
analyticsSchema.index({ date: 1, post: 1 }, { unique: true });

const Subscriber = mongoose.model('Subscriber', subscriberSchema);
const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = { Subscriber, Analytics };
