require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const { Category, Tag } = require('../models/Category');
const Comment = require('../models/Comment');
const { Subscriber, Analytics } = require('../models/Subscriber');

const clearDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ MongoDB Connected');

        console.log('\n🗑️  Clearing database...\n');

        await Promise.all([
            User.deleteMany({}),
            Post.deleteMany({}),
            Category.deleteMany({}),
            Tag.deleteMany({}),
            Comment.deleteMany({}),
            Subscriber.deleteMany({}),
            Analytics.deleteMany({})
        ]);

        console.log('✓ Database cleared successfully!\n');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
};

clearDatabase();
