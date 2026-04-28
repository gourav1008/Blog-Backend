const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRelationships() {
  const { data, error } = await supabase
    .from('bookmarks')
    .select(`*`)
    .limit(1);
  
  if (error) {
    console.error('Error fetching bookmarks:', error);
  } else {
    console.log('Bookmarks fetch success');
  }

  // Try the failing join mentioned in error
  const { error: joinError } = await supabase
    .from('bookmarks')
    .select('*, users(*)');
  
  if (joinError) {
    console.error('Join Error (bookmarks -> users):', joinError.message);
  } else {
    console.log('Join Success (bookmarks -> users)');
  }
}

checkRelationships();
