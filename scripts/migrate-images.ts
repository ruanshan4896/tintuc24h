/**
 * Migration Script: Upload existing external images to Supabase Storage
 * 
 * Usage:
 *   npx tsx scripts/migrate-images.ts
 * 
 * Options:
 *   --dry-run    : Preview changes without uploading
 *   --limit=N    : Limit number of articles to process
 *   --force      : Re-upload even if already on Supabase
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { uploadImageToSupabase, isSupabaseStorageUrl } from '../lib/utils/image-upload';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface MigrationStats {
  total: number;
  skipped: number;
  success: number;
  failed: number;
  errors: Array<{ slug: string; error: string }>;
}

async function migrateImages() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     IMAGE MIGRATION TO SUPABASE STORAGE                ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Configuration:');
  console.log(`  - Dry Run: ${dryRun ? 'YES (no changes will be made)' : 'NO'}`);
  console.log(`  - Force: ${force ? 'YES (re-upload existing)' : 'NO'}`);
  console.log(`  - Limit: ${limit || 'None (all articles)'}`);
  console.log('');

  const stats: MigrationStats = {
    total: 0,
    skipped: 0,
    success: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Get all articles with images
    let query = supabase
      .from('articles')
      .select('id, slug, title, image_url')
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data: articles, error } = await query;

    if (error) {
      throw error;
    }

    if (!articles || articles.length === 0) {
      console.log('✅ No articles with images found');
      return;
    }

    stats.total = articles.length;
    console.log(`📊 Found ${stats.total} articles with images\n`);
    console.log('─'.repeat(60));

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const progress = `[${i + 1}/${articles.length}]`;

      console.log(`\n${progress} Processing: ${article.title.substring(0, 50)}...`);
      console.log(`  Slug: ${article.slug}`);
      console.log(`  Current URL: ${article.image_url.substring(0, 80)}...`);

      // Skip if already on Supabase (unless force)
      if (!force && isSupabaseStorageUrl(article.image_url)) {
        console.log(`  ⏭️  SKIPPED: Already on Supabase Storage`);
        stats.skipped++;
        continue;
      }

      if (dryRun) {
        console.log(`  🔍 DRY RUN: Would upload to Supabase`);
        stats.skipped++;
        continue;
      }

      try {
        // Upload to Supabase
        console.log(`  📤 Uploading to Supabase...`);
        const newUrl = await uploadImageToSupabase(
          article.image_url,
          article.slug,
          'featured',
          { format: 'avif', quality: 80 }
        );

        if (!newUrl) {
          throw new Error('Upload returned null');
        }

        // Update database
        const { error: updateError } = await supabase
          .from('articles')
          .update({ image_url: newUrl })
          .eq('id', article.id);

        if (updateError) {
          throw updateError;
        }

        console.log(`  ✅ SUCCESS: ${newUrl}`);
        stats.success++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        console.error(`  ❌ FAILED: ${error.message}`);
        stats.failed++;
        stats.errors.push({
          slug: article.slug,
          error: error.message,
        });
      }
    }

    // Print summary
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Total articles:     ${stats.total}`);
    console.log(`✅ Successful:      ${stats.success}`);
    console.log(`⏭️  Skipped:         ${stats.skipped}`);
    console.log(`❌ Failed:          ${stats.failed}`);
    console.log('');

    if (stats.errors.length > 0) {
      console.log('Failed articles:');
      stats.errors.forEach(({ slug, error }) => {
        console.log(`  - ${slug}: ${error}`);
      });
      console.log('');
    }

    if (dryRun) {
      console.log('💡 This was a dry run. Run without --dry-run to apply changes.');
    } else if (stats.success > 0) {
      console.log('✅ Migration completed successfully!');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Verify images are loading correctly');
      console.log('  2. Check Supabase Storage dashboard');
      console.log('  3. Consider removing old image proxy code');
    }

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
migrateImages()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
