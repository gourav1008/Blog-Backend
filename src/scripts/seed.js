require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Post = require('../models/Post');
const { Category } = require('../models/Category');
const Tag = require('../models/Tag');
const Comment = require('../models/Comment');
const { Subscriber, Analytics } = require('../models/Subscriber');

// Database connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ MongoDB Connected');
    } catch (error) {
        console.error('✗ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Sample data
const categoriesData = [
    { name: 'Technology', description: 'Latest in tech trends and innovations' },
    { name: 'Web Development', description: 'Everything about web development' },
    { name: 'AI & Machine Learning', description: 'Artificial Intelligence and ML insights' },
    { name: 'Career', description: 'Career tips and professional development' },
    { name: 'Finance', description: 'Personal finance and investment strategies' },
    { name: 'Startups', description: 'Startup culture and entrepreneurship' },
    { name: 'Design', description: 'UI/UX and design principles' },
    { name: 'Productivity', description: 'Tools and tips for productivity' },
];

const tagsData = [
    'JavaScript', 'React', 'Node.js', 'MongoDB', 'TypeScript', 'Next.js',
    'AI', 'Machine Learning', 'Career Tips', 'Freelancing', 'Investment',
    'SaaS', 'UI/UX', 'Remote Work', 'DevOps', 'Python', 'CSS', 'Docker',
    'Kubernetes', 'Cloud Computing'
];

const usersData = [
    {
        name: 'Admin User',
        email: 'admin@blog.com',
        password: 'Admin@123',
        role: 'admin',
        bio: 'Chief Editor and blog administrator with 10+ years in tech journalism.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
    },
    {
        name: 'Sarah Johnson',
        email: 'sarah@blog.com',
        password: 'Editor@123',
        role: 'editor',
        bio: 'Senior tech writer specializing in web development and cloud technologies.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
    },
    {
        name: 'Michael Chen',
        email: 'michael@blog.com',
        password: 'Editor@123',
        role: 'editor',
        bio: 'AI researcher and technical writer, passionate about machine learning.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael'
    },
    {
        name: 'Emma Williams',
        email: 'emma@blog.com',
        password: 'Editor@123',
        role: 'editor',
        bio: 'UX/UI designer and content creator focusing on design systems.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma'
    },
    {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'User@123',
        role: 'user',
        bio: 'Tech enthusiast and avid reader.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
    },
    {
        name: 'Lisa Anderson',
        email: 'lisa@example.com',
        password: 'User@123',
        role: 'user',
        bio: 'Software developer interested in full-stack development.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa'
    },
    {
        name: 'David Martinez',
        email: 'david@example.com',
        password: 'User@123',
        role: 'user',
        bio: 'Startup founder and entrepreneur.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David'
    },
    {
        name: 'Rachel Green',
        email: 'rachel@example.com',
        password: 'User@123',
        role: 'user',
        bio: 'Digital marketer and content strategist.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rachel'
    },
    {
        name: 'Tom Wilson',
        email: 'tom@example.com',
        password: 'User@123',
        role: 'user',
        bio: 'DevOps engineer passionate about automation.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom'
    },
    {
        name: 'Sophie Brown',
        email: 'sophie@example.com',
        password: 'User@123',
        role: 'user',
        bio: 'Finance professional exploring tech investments.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie'
    },
    {
        name: 'Alex Turner',
        email: 'alex@example.com',
        password: 'User@123',
        role: 'user',
        bio: 'Freelance developer building SaaS products.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
    },
    {
        name: 'Maria Garcia',
        email: 'maria@example.com',
        password: 'User@123',
        role: 'user',
        bio: 'Remote work advocate and productivity coach.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria'
    }
];

const blogTitles = [
    'Getting Started with Next.js 15: A Comprehensive Guide',
    'The Future of AI: Trends to Watch in 2026',
    'Building Scalable Microservices with Node.js',
    'Mastering TypeScript: Advanced Patterns and Best Practices',
    'How to Land Your First Tech Job in 2026',
    'React Server Components: A Deep Dive',
    'MongoDB Performance Optimization Techniques',
    'The Rise of Edge Computing: What Developers Need to Know',
    'Career Growth: From Junior to Senior Developer',
    'Understanding Web3 and Blockchain Technology',
    'CSS Grid vs Flexbox: When to Use What',
    'Docker and Kubernetes for Beginners',
    'Remote Work Best Practices for Software Teams',
    'Building a SaaS Product from Scratch',
    'GraphQL vs REST: Which One Should You Choose?',
    'The Art of Code Reviews: A Guide for Teams',
    'Investment Strategies for Tech Professionals',
    'UI/UX Design Principles That Actually Matter',
    'Freelancing as a Developer: Complete Guide',
    'Python for Data Science: Getting Started',
    'Serverless Architecture: Pros and Cons',
    'DevOps Culture: Building Better Teams',
    'The Complete Guide to API Security',
    'Modern JavaScript: ES2024 Features',
    'Cloud Computing Fundamentals for Developers',
    'Startup Funding: A Comprehensive Guide',
    'Building Progressive Web Apps in 2026',
    'Database Design Best Practices',
    'The Psychology of User Experience',
    'Git Workflow Strategies for Large Teams',
    'Machine Learning for Web Developers',
    'Cryptocurrency and NFTs: A Technical Overview',
    'Testing Strategies for React Applications',
    'The Complete Guide to Web Performance',
    'Building Real-Time Applications with WebSockets',
    'Cybersecurity Essentials for Developers',
    'The Future of Frontend Development',
    'Personal Branding for Tech Professionals',
    'Agile vs Waterfall: Modern Project Management',
    'The Complete Guide to Responsive Design',
    'Building Accessible Web Applications',
    'Microservices vs Monoliths: Architecture Decisions',
    'The Developers Guide to Financial Independence',
    'Cloud-Native Development Practices',
    'Building Chatbots with Natural Language Processing',
    'The Complete Guide to SEO for Developers',
    'Continuous Integration and Deployment Best Practices',
    'Building E-commerce Platforms: Technical Guide',
    'The Art of Technical Writing',
    'Modern Authentication and Authorization Patterns'
];

const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
};

const generateExcerpt = (title) => {
    const excerpts = [
        `Discover everything you need to know about ${title.toLowerCase()}. This comprehensive guide covers best practices, common pitfalls, and expert insights.`,
        `Learn the ins and outs of ${title.toLowerCase()} with practical examples and real-world applications that you can implement today.`,
        `An in-depth exploration of ${title.toLowerCase()}, covering fundamental concepts and advanced techniques for modern developers.`,
        `Master ${title.toLowerCase()} with this detailed guide featuring code examples, tips, and industry best practices.`
    ];
    return excerpts[Math.floor(Math.random() * excerpts.length)];
};

const generateContent = (title) => {
    return `
# ${title}

## Introduction

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. In this comprehensive guide, we'll explore everything you need to know about this topic.

## Key Concepts

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Here are the fundamental concepts you should understand:

### Concept 1: Foundation

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. This is crucial for understanding the bigger picture.

- Point one with detailed explanation
- Point two with practical examples
- Point three with real-world applications

### Concept 2: Advanced Techniques

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Let's dive deeper into advanced strategies.

\`\`\`javascript
// Example code snippet
const example = () => {
    console.log('This is a practical example');
    return true;
};
\`\`\`

## Best Practices

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium. Following these best practices will help you achieve better results:

1. **First Best Practice**: Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

2. **Second Best Practice**: Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores.

3. **Third Best Practice**: Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.

## Common Pitfalls to Avoid

At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores:

- Avoiding premature optimization
- Not considering scalability from the start
- Ignoring security best practices
- Neglecting proper documentation

## Real-World Applications

Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus. Here's how this applies in practice:

### Use Case 1
Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.

### Use Case 2
Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.

## Performance Considerations

On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment.

\`\`\`javascript
// Performance optimization example
const optimizedFunction = (data) => {
    // Implementation details
    return data.map(item => item.value).filter(x => x > 0);
};
\`\`\`

## Future Trends

These cases are perfectly simple and easy to distinguish. In a free hour, when our power of choice is untrammelled and when nothing prevents our being able to do what we like best.

## Conclusion

To sum up, we've covered the essential aspects of this topic. The key takeaways are:

- Understanding the fundamentals is crucial
- Best practices ensure long-term success
- Staying updated with trends is important
- Practical application solidifies learning

Thank you for reading! Feel free to leave your thoughts in the comments below.
    `.trim();
};

const commentTexts = [
    'Great article! This really helped me understand the concept better.',
    'Thanks for sharing this comprehensive guide. Very useful!',
    'I have a question about the implementation details. Could you elaborate?',
    'This is exactly what I was looking for. Bookmarking for future reference.',
    'Excellent breakdown of a complex topic. Much appreciated!',
    'I disagree with some points, but overall a solid article.',
    'Could you provide more examples? That would be helpful.',
    'This saved me hours of research. Thank you!',
    'Well written and easy to follow. Great work!',
    'Looking forward to more articles like this.',
    'The code examples are particularly helpful.',
    'This should be required reading for anyone starting out.',
    'I tried implementing this and it worked perfectly!',
    'One of the best explanations I\'ve found on this topic.',
    'Can you recommend any additional resources on this?'
];

const replyTexts = [
    'Thanks for the feedback! Glad it helped.',
    'Good question! Let me clarify...',
    'I appreciate your perspective on this.',
    'That\'s a great point you\'ve raised.',
    'Thanks for sharing your experience!',
    'I\'ll consider adding more examples in a future update.',
    'Glad you found it useful!',
    'Feel free to reach out if you have more questions.'
];

// Helper function to get random items from array
const getRandomItems = (array, count) => {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

// Helper function to get random date in the past 6 months
const getRandomPastDate = (monthsAgo = 6) => {
    const now = new Date();
    const past = new Date(now.getFullYear(), now.getMonth() - monthsAgo, now.getDate());
    const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
    return new Date(randomTime);
};

// Main seeding function
const seedDatabase = async () => {
    try {
        console.log('\n🌱 Starting database seeding...\n');

        // Check if data already exists
        const existingPosts = await Post.countDocuments();
        if (existingPosts > 0) {
            console.log('⚠️  Database already contains data. Forcing reseed...\n');
        }

        // Clear existing data (safety check passed)
        console.log('🗑️  Clearing existing data...');
        await Promise.all([
            User.deleteMany({}),
            Post.deleteMany({}),
            Category.deleteMany({}),
            Tag.deleteMany({}),
            Comment.deleteMany({}),
            Subscriber.deleteMany({}),
            Analytics.deleteMany({})
        ]);
        console.log('✓ Cleared\n');

        // 1. Create Categories
        console.log('📁 Creating categories...');
        const categories = await Category.insertMany(
            categoriesData.map(cat => ({
                ...cat,
                slug: generateSlug(cat.name)
            }))
        );
        console.log(`✓ Created ${categories.length} categories\n`);

        // 2. Create Tags
        console.log('🏷️  Creating tags...');
        const tags = await Tag.insertMany(
            tagsData.map(tag => ({
                name: tag,
                slug: generateSlug(tag)
            }))
        );
        console.log(`✓ Created ${tags.length} tags\n`);

        // 3. Create Users
        console.log('👥 Creating users...');
        const hashedUsersData = await Promise.all(
            usersData.map(async (user) => ({
                ...user,
                password: await bcrypt.hash(user.password, 12),
            }))
        );
        const users = await User.insertMany(hashedUsersData);
        console.log(`✓ Created ${users.length} users\n`);

        // Get editor users for post authorship
        const editors = users.filter(u => u.role === 'editor' || u.role === 'admin');
        const regularUsers = users.filter(u => u.role === 'user');

        // 4. Create Posts
        console.log('📝 Creating blog posts...');
        const postsToCreate = blogTitles.slice(0, 40); // Create 40 posts
        const posts = [];

        for (let i = 0; i < postsToCreate.length; i++) {
            const title = postsToCreate[i];
            const author = editors[Math.floor(Math.random() * editors.length)];
            const category = categories[Math.floor(Math.random() * categories.length)];
            const postTags = getRandomItems(tags, Math.floor(Math.random() * 4) + 1);
            const isFeatured = i < 6; // First 6 posts are featured
            const isSponsored = Math.random() < 0.15; // 15% sponsored
            const viewCount = Math.floor(Math.random() * 4500) + 100;
            const publishDate = getRandomPastDate(6);

            const post = await Post.create({
                title,
                slug: generateSlug(title),
                content: generateContent(title),
                excerpt: generateExcerpt(title),
                author: author._id,
                coverImage: `https://picsum.photos/seed/${i}/1200/630`,
                category: category._id,
                tags: postTags.map(t => t._id),
                status: 'published',
                publishDate,
                viewCount,
                isFeatured,
                isSponsored,
                seo: {
                    title: title,
                    description: generateExcerpt(title),
                    keywords: postTags.map(t => t.name)
                }
            });

            posts.push(post);
        }
        console.log(`✓ Created ${posts.length} posts\n`);

        // 5. Add Likes to Posts
        console.log('❤️  Adding likes to posts...');
        let totalLikes = 0;
        for (const post of posts) {
            const likeCount = Math.floor(Math.random() * 30) + 5;
            const likers = getRandomItems(users, likeCount);
            post.likes = likers.map(u => u._id);
            await post.save();
            totalLikes += likeCount;
        }
        console.log(`✓ Added ${totalLikes} likes\n`);

        // 6. Create Comments
        console.log('💬 Creating comments...');
        const comments = [];

        for (const post of posts) {
            const commentCount = Math.floor(Math.random() * 4) + 2; // 2-5 comments per post

            for (let i = 0; i < commentCount; i++) {
                const commenter = regularUsers[Math.floor(Math.random() * regularUsers.length)];
                const commentText = commentTexts[Math.floor(Math.random() * commentTexts.length)];

                const comment = await Comment.create({
                    content: commentText,
                    author: commenter._id,
                    post: post._id,
                    createdAt: getRandomPastDate(3)
                });

                comments.push(comment);

                // Add 1-2 replies to some comments (50% chance)
                if (Math.random() < 0.5) {
                    const replyCount = Math.floor(Math.random() * 2) + 1;
                    for (let j = 0; j < replyCount; j++) {
                        const replier = users[Math.floor(Math.random() * users.length)];
                        const replyText = replyTexts[Math.floor(Math.random() * replyTexts.length)];

                        const reply = await Comment.create({
                            content: replyText,
                            author: replier._id,
                            post: post._id,
                            parentComment: comment._id,
                            createdAt: new Date(comment.createdAt.getTime() + Math.random() * 86400000) // Up to 1 day later
                        });

                        comment.replies.push(reply._id);
                        comments.push(reply);
                    }
                    await comment.save();
                }
            }
        }
        console.log(`✓ Created ${comments.length} comments\n`);

        // 7. Add Bookmarks for Users
        console.log('🔖 Adding bookmarks...');
        let totalBookmarks = 0;
        for (const user of regularUsers) {
            const bookmarkCount = Math.floor(Math.random() * 8) + 3;
            const bookmarkedPosts = getRandomItems(posts, bookmarkCount);
            user.bookmarks = bookmarkedPosts.map(p => p._id);
            await user.save();
            totalBookmarks += bookmarkCount;
        }
        console.log(`✓ Added ${totalBookmarks} bookmarks\n`);

        // 8. Create Analytics Data
        console.log('📊 Creating analytics data...');
        const analyticsData = [];
        const trendingPosts = posts.slice(0, 15); // Top 15 posts get analytics

        for (const post of trendingPosts) {
            // Create analytics for the last 30 days
            for (let i = 0; i < 30; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);

                const views = Math.floor(Math.random() * 200) + 50;
                const uniqueVisitors = Math.floor(views * 0.7);

                analyticsData.push({
                    post: post._id,
                    views,
                    uniqueVisitors,
                    date
                });
            }
        }
        await Analytics.insertMany(analyticsData);
        console.log(`✓ Created ${analyticsData.length} analytics entries\n`);

        // 9. Create Newsletter Subscribers
        console.log('📧 Creating newsletter subscribers...');
        const subscriberEmails = [
            { email: 'subscriber1@example.com', source: 'footer' },
            { email: 'subscriber2@example.com', source: 'popup' },
            { email: 'subscriber3@example.com', source: 'post-bottom' },
            { email: 'subscriber4@example.com', source: 'footer' },
            { email: 'subscriber5@example.com', source: 'popup' },
            { email: 'subscriber6@example.com', source: 'footer' },
            { email: 'subscriber7@example.com', source: 'popup' },
            { email: 'subscriber8@example.com', source: 'post-bottom' },
            { email: 'subscriber9@example.com', source: 'footer' },
            { email: 'subscriber10@example.com', source: 'popup' },
            { email: 'subscriber11@example.com', source: 'footer' },
            { email: 'subscriber12@example.com', source: 'post-bottom' },
            { email: 'subscriber13@example.com', source: 'popup' },
            { email: 'subscriber14@example.com', source: 'footer' },
            { email: 'subscriber15@example.com', source: 'popup' },
            { email: 'subscriber16@example.com', source: 'post-bottom' },
            { email: 'subscriber17@example.com', source: 'footer' },
            { email: 'subscriber18@example.com', source: 'popup' },
            { email: 'subscriber19@example.com', source: 'footer' },
            { email: 'subscriber20@example.com', source: 'popup' },
        ];

        const subscribers = await Subscriber.insertMany(subscriberEmails);
        console.log(`✓ Created ${subscribers.length} subscribers\n`);

        // Summary
        console.log('✅ Database seeding completed successfully!\n');
        console.log('📊 Summary:');
        console.log(`   • ${categories.length} categories`);
        console.log(`   • ${tags.length} tags`);
        console.log(`   • ${users.length} users`);
        console.log(`   • ${posts.length} blog posts`);
        console.log(`   • ${comments.length} comments`);
        console.log(`   • ${totalLikes} total likes`);
        console.log(`   • ${totalBookmarks} total bookmarks`);
        console.log(`   • ${analyticsData.length} analytics entries`);
        console.log(`   • ${subscribers.length} newsletter subscribers`);
        console.log('\n🎉 Ready for production!\n');
        console.log('👤 Login credentials:');
        console.log('   Admin: admin@blog.com / Admin@123');
        console.log('   Editor: sarah@blog.com / Editor@123');
        console.log('   User: john@example.com / User@123\n');

    } catch (error) {
        console.error('✗ Seeding error:', error);
        throw error;
    }
};

// Run the seeder
const run = async () => {
    await connectDB();
    await seedDatabase();
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
    process.exit(0);
};

run();
