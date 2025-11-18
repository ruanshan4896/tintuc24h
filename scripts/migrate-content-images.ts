/**
 * Migration Script: Upload images inside article content to Supabase Storage
 * 
 * This script finds all images in Markdown content and uploads them to Supabase
 * 
 * Usage:
 *   npx tsx scripts/migrate-content-images.ts
 * 
 * Options:
 *   --dry-run    : Preview changes without uploading
 *   --limit=N    : Limit number of articles to process
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
  articlesProcessed: number;
  imagesFound: number;
  imagesSkipped: number;
  imagesUploaded: number;
  imagesFailed: number;
  errors: Array<{ article: string; image: string; error: string }>;
}

/**
 * Extract all image URLs from Markdown content
 */
function extractImageUrls(content: string): string[] {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const urls: string[] = [];
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    const url = match[2];
    // Skip data URLs and already migrated Supabase URLs
    if (!url.startsWith('data:') && !isSupabaseStorageUrl(url)) {
      urls.push(url);
    }
  }

  return urls;
}

/**
 * Replace image URL in content
 */
function replaceImageUrl(content: string, oldUrl: string, newUrl: string): string {
  // Escape special regex characters in URL
  const escapedOldUrl = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(!\\[[^\\]]*\\]\\()${escapedOldUrl}(\\))`, 'g');
  return content.replace(regex, `$1${newUrl}$2`);
}

async function migrateContentImages() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   MIGRATE IMAGES IN ARTICLE CONTENT TO SUPABASE        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Configuration:');
  console.log(`  - Dry Run: ${dryRun ? 'YES (no changes will be made)' : 'NO'}`);
  console.log(`  - Limit: ${limit || 'None (all articles)'}`);
  console.log('');

  const stats: MigrationStats = {
    articlesProcessed: 0,
    imagesFound: 0,
    imagesSkipped: 0,
    imagesUploaded: 0,
    imagesFailed: 0,
    errors: [],
  };

  try {
    // Get all articles
    let query = supabase
      .from('articles')
      .select('id, slug, title, content')
      .not('content', 'is', null)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data: articles, error } = await query;

    if (error) {
      throw error;
    }

    if (!articles || articles.length === 0) {
      console.log('✅ No articles found');
      return;
    }

    console.log(`📊 Found ${articles.length} articles to process\n`);
    console.log('─'.repeat(60));

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const progress = `[${i + 1}/${articles.length}]`;

      console.log(`\n${progress} Processing: ${article.title.substring(0, 50)}...`);
      console.log(`  Slug: ${article.slug}`);

      // Extract image URLs from content
      const imageUrls = extractImageUrls(article.content);
      
      if (imageUrls.length === 0) {
        console.log(`  ⏭️  No external images found in content`);
        stats.articlesProcessed++;
        continue;
      }

      console.log(`  📸 Found ${imageUrls.length} image(s) in content`);
      stats.imagesFound += imageUrls.length;

      let updatedContent = article.content;
      let hasChanges = false;

      for (let j = 0; j < imageUrls.length; j++) {
        const imageUrl = imageUrls[j];
        console.log(`    [${j + 1}/${imageUrls.length}] ${imageUrl.substring(0, 60)}...`);

        if (dryRun) {
          console.log(`      🔍 DRY RUN: Would upload to Supabase`);
          stats.imagesSkipped++;
          continue;
        }

        try {
          // Upload to Supabase
          const newUrl = await uploadImageToSupabase(
            imageUrl,
            `${article.slug}-content-${j}`,
            'content',
            { format: 'avif', quality: 80 }
          );

          if (!newUrl) {
            throw new Error('Upload returned null');
          }

          // Replace URL in content
          updatedContent = replaceImageUrl(updatedContent, imageUrl, newUrl);
          hasChanges = true;

          console.log(`      ✅ Uploaded & replaced`);
          stats.imagesUploaded++;

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error: any) {
          console.error(`      ❌ Failed: ${error.message}`);
          stats.imagesFailed++;
          stats.errors.push({
            article: article.slug,
            image: imageUrl,
            error: error.message,
          });
        }
      }

      // Update article content if there were changes
      if (hasChanges && !dryRun) {
        const { error: updateError } = await supabase
          .from('articles')
          .update({ content: updatedContent })
          .eq('id', article.id);

        if (updateError) {
          console.error(`  ❌ Failed to update article: ${updateError.message}`);
        } else {
          console.log(`  💾 Content updated successfully`);
        }
      }

      stats.articlesProcessed++;
    }

    // Print summary
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Articles processed:  ${stats.articlesProcessed}`);
    console.log(`Images found:        ${stats.imagesFound}`);
    console.log(`✅ Uploaded:         ${stats.imagesUploaded}`);
    console.log(`⏭️  Skipped:          ${stats.imagesSkipped}`);
    console.log(`❌ Failed:           ${stats.imagesFailed}`);
    console.log('');

    if (stats.errors.length > 0) {
      console.log('Failed images:');
      stats.errors.forEach(({ article, image, error }) => {
        console.log(`  - ${article}: ${image.substring(0, 50)}...`);
        console.log(`    Error: ${error}`);
      });
      console.log('');
    }

    if (dryRun) {
      console.log('💡 This was a dry run. Run without --dry-run to apply changes.');
    } else if (stats.imagesUploaded > 0) {
      console.log('✅ Migration completed successfully!');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Verify images in articles are loading correctly');
      console.log('  2. Check Supabase Storage dashboard');
      console.log('  3. Clear Next.js cache: rm -rf .next');
    }

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
migrateContentImages()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
