require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('✗ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Sample Data ---
const categoriesData = [
    { name: 'Technology', description: 'Latest in tech trends and innovations' },
    { name: 'Web Development', description: 'Everything about web development' },
    { name: 'AI & Machine Learning', description: 'Artificial Intelligence and ML insights' },
    { name: 'Design', description: 'UI/UX and design principles' },
    { name: 'Productivity', description: 'Tools and tips for productivity' },
    { name: 'Business', description: 'Entrepreneurship and startup advice' },
    { name: 'Lifestyle', description: 'Balancing work, health, and life' },
    { name: 'Security', description: 'Cybersecurity and best practices' },
    { name: 'Mobile App', description: 'iOS, Android, and cross-platform apps' },
    { name: 'Cloud Computing', description: 'AWS, Azure, and cloud architecture' }
];

const tagsData = [
    'JavaScript', 'React', 'Node.js', 'TypeScript', 'Next.js', 'AI', 'Cloud Computing',
    'PostgreSQL', 'Supabase', 'Clerk', 'TailwindCSS', 'Vercel', 'Python', 'Machine Learning', 'Frontend'
];

const blogTitles = [
    'Getting Started with Next.js 16: A Comprehensive Guide',
    'The Future of AI: Trends to Watch in 2026',
    'Building Scalable Microservices with Node.js',
    'Mastering TypeScript: Advanced Patterns and Best Practices',
    'The Rise of Edge Computing: What Developers Need to Know',
    'CSS Grid vs Flexbox: When to Use What',
    'Docker and Kubernetes for Beginners',
    'UI/UX Design Principles That Actually Matter',
    'How to Architect a Supabase Database',
    'Using Clerk for Seamless Authentication',
    'TailwindCSS Best Practices for Large Projects',
    'Why PostgreSQL is Still the King of Databases',
    'Understanding the Next.js App Router',
    'A Guide to Serverless Computing',
    'Creating Accessible Web Applications',
    '10 Productivity Hacks for Software Engineers'
];

const generateSlug = (title) => title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

const seedDatabase = async () => {
    try {
        console.log('🌱 Starting Supabase seeding...\n');

        // 1. Create a System Author (to satisfy foreign keys)
        console.log('👤 Creating System Author...');
        const { data: author, error: authorError } = await supabase
            .from('users')
            .upsert({
                id: 'system_author_demo', // String ID for Clerk compatibility
                name: 'System Author',
                email: 'system@blog.com',
                role: 'admin',
                subscription: 'premium'
            })
            .select()
            .single();

        if (authorError) throw authorError;
        console.log('✓ System Author ready\n');

        // 2. Categories
        console.log('📁 Seeding Categories...');
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .upsert(categoriesData.map(c => ({ ...c, slug: generateSlug(c.name) })))
            .select();
        
        if (catError) throw catError;
        console.log(`✓ ${categories.length} Categories seeded\n`);

        // 3. Tags
        console.log('🏷️  Seeding Tags...');
        const { data: tags, error: tagError } = await supabase
            .from('tags')
            .upsert(tagsData.map(name => ({ name, slug: generateSlug(name) })))
            .select();
        
        if (tagError) throw tagError;
        console.log(`✓ ${tags.length} Tags seeded\n`);

        // 4. Posts
        console.log('📝 Seeding Posts...');
        for (let i = 0; i < blogTitles.length; i++) {
            const title = blogTitles[i];
            const category = categories[i % categories.length];
            
            const { data: post, error: postError } = await supabase
                .from('posts')
                .upsert({
                    title,
                    slug: `${generateSlug(title)}-${i}`,
                    content: `This is the demo content for ${title}. Lorem ipsum dolor sit amet...`,
                    excerpt: `A quick overview of ${title}.`,
                    featured_image: `https://picsum.photos/seed/${i}/1200/630`,
                    author_id: author.id,
                    category_id: category.id,
                    status: 'published',
                    is_featured: i === 0
                })
                .select()
                .single();

            if (postError) {
                console.warn(`  ⚠️  Error seeding post "${title}":`, postError.message);
                continue;
            }

            // Link some tags
            const randomTags = tags.slice(0, 2);
            await supabase.from('post_tags').upsert(randomTags.map(t => ({
                post_id: post.id,
                tag_id: t.id
            })));
        }

        console.log('\n✅ Seeding completed successfully!');
    } catch (error) {
        console.error('\n✗ Seeding failed:', error.message || error);
        process.exit(1);
    }
};

seedDatabase();
