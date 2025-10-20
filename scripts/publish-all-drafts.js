// One-time script to publish all draft articles
// Run with: node scripts/publish-all-drafts.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function publishAllDrafts() {
  console.log('Fetching all draft and archived articles...\n');

  // Fetch all draft and archived articles (matching the "My Drafts" page)
  const { data: drafts, error: fetchError } = await supabase
    .from('articles')
    .select('id, title, status')
    .in('status', ['draft', 'archived']);

  if (fetchError) {
    console.error('Error fetching drafts:', fetchError);
    return;
  }

  if (!drafts || drafts.length === 0) {
    console.log('No draft or archived articles found.');
    return;
  }

  console.log(`Found ${drafts.length} article(s):\n`);
  const draftCount = drafts.filter(d => d.status === 'draft').length;
  const archivedCount = drafts.filter(d => d.status === 'archived').length;
  console.log(`  - ${draftCount} draft(s)`);
  console.log(`  - ${archivedCount} archived\n`);

  drafts.forEach((draft, i) => {
    console.log(`${i + 1}. [${draft.status.toUpperCase()}] ${draft.title}`);
  });

  console.log('\n📢 Publishing all drafts and archived articles...\n');

  // Update all to published
  const { data: updated, error: updateError } = await supabase
    .from('articles')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .in('status', ['draft', 'archived'])
    .select('id, title, status, published_at');

  if (updateError) {
    console.error('Error publishing drafts:', updateError);
    return;
  }

  console.log(`✅ Successfully published ${updated.length} article(s)!\n`);
  updated.forEach((article, i) => {
    console.log(`${i + 1}. ${article.title} - now published`);
  });
}

publishAllDrafts()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
