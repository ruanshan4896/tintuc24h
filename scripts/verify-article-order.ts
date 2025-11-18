/**
 * Verify Article Order in Database
 * Check if articles are sorted correctly by created_at
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyArticleOrder() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         VERIFY ARTICLE ORDER BY CATEGORY               ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  const categories = [
    'Tin Nóng',
    'Công nghệ',
    'Thể thao',
    'Sức khỏe',
    'Ô tô',
    'Giải trí',
    'Game',
  ];

  for (const category of categories) {
    console.log(`\n📂 Category: ${category}`);
    console.log('─'.repeat(60));

    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, created_at, published')
      .eq('category', category)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error(`❌ Error: ${error.message}`);
      continue;
    }

    if (!articles || articles.length === 0) {
      console.log('  ℹ️  No articles found');
      continue;
    }

    console.log(`  Found ${articles.length} articles (showing top 10):\n`);

    articles.forEach((article, idx) => {
      const date = new Date(article.created_at);
      const dateStr = date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      console.log(`  ${idx + 1}. [${dateStr}] ${article.title.substring(0, 60)}...`);
    });

    // Check if sorted correctly
    let isSorted = true;
    for (let i = 0; i < articles.length - 1; i++) {
      const current = new Date(articles[i].created_at).getTime();
      const next = new Date(articles[i + 1].created_at).getTime();
      if (current < next) {
        isSorted = false;
        break;
      }
    }

    if (isSorted) {
      console.log('\n  ✅ Sorted correctly (newest first)');
    } else {
      console.log('\n  ❌ NOT sorted correctly!');
    }
  }

  console.log('\n');
  console.log('═'.repeat(60));
  console.log('VERIFICATION COMPLETE');
  console.log('═'.repeat(60));
  console.log('');
  console.log('If articles are sorted correctly in database but not on website:');
  console.log('  1. Clear Next.js cache: rm -rf .next');
  console.log('  2. Restart dev server: npm run dev');
  console.log('  3. Or deploy to Vercel (cache will be cleared)');
}

verifyArticleOrder()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
