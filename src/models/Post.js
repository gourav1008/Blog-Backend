const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Post must have a title'],
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
        },
        content: {
            type: String,
            required: [true, 'Post must have content'],
        },
        excerpt: {
            type: String,
            maxlength: 300,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        coverImage: {
            type: String,
            required: true,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        // FIX: ref changed from non-existent 'Tag' to 'Tag' — Tag.js model now exists
        tags: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Tag',
            },
        ],
        status: {
            type: String,
            enum: ['draft', 'published', 'scheduled'],
            default: 'draft',
        },
        publishDate: {
            type: Date,
            default: Date.now,
        },
        viewCount: {
            type: Number,
            default: 0,
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        seo: {
            title: String,
            description: String,
            keywords: [String],
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: Date,
        isSponsored: {
            type: Boolean,
            default: false,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        isPremium: {
            type: Boolean,
            default: false,
        },
        adSlots: [
            {
                position: String,
                adId: String,
            },
        ],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// --- Indexes for performance ---

// Slug is the primary lookup key for post detail pages
// postSchema.index({ slug: 1 }); // Removed: already indexed via unique: true in schema definition

// Most queries filter on status + isDeleted together
postSchema.index({ status: 1, isDeleted: 1 });

// Featured posts query
postSchema.index({ isFeatured: 1, status: 1, isDeleted: 1 });

// Author dashboard
postSchema.index({ author: 1, status: 1 });

// Category listing
postSchema.index({ category: 1, status: 1, isDeleted: 1 });

// Trending posts sort
postSchema.index({ viewCount: -1, createdAt: -1 });

// Full-text search
postSchema.index({ title: 'text', content: 'text', excerpt: 'text' });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
