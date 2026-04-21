const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Tag must have a name'],
            trim: true,
            unique: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        description: {
            type: String,
            maxlength: 200,
        },
        postCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// tagSchema.index({ slug: 1 }); // Removed: already indexed via unique: true in schema definition
tagSchema.index({ name: 'text' });

// Use cached model to avoid OverwriteModelError on nodemon restarts
const Tag = mongoose.models.Tag || mongoose.model('Tag', tagSchema);
module.exports = Tag;
