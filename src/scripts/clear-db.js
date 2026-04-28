require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('✗ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const clearDatabase = async () => {
    try {
        console.log('✓ Supabase Connected (Service Role)');
        console.log('\n🗑️  Clearing Supabase tables...\n');

        // Order matters due to foreign key constraints
        const tables = [
            'likes',
            'comments',
            'bookmarks',
            'post_tags',
            'posts',
            'tags',
            'categories',
            'subscribers',
            'users'
        ];

        for (const table of tables) {
            console.log(`  - Clearing ${table}...`);
            const { error } = await supabase
                .from(table)
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

            if (error) {
                console.warn(`  ⚠️  Warning clearing ${table}:`, error.message);
            }
        }

        console.log('\n✅ Database cleared successfully!\n');
    } catch (error) {
        console.error('✗ Unexpected error:', error);
        process.exit(1);
    }
};

clearDatabase();
