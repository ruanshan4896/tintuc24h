/**
 * Test Script: Upload a single test image to Supabase Storage
 * 
 * Usage:
 *   npx tsx scripts/test-upload.ts
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { uploadImageToSupabase } from '../lib/utils/image-upload';

const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop';
const TEST_SLUG = 'test-image-upload';

async function testUpload() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     TEST IMAGE UPLOAD TO SUPABASE STORAGE              ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Test Image URL: ${TEST_IMAGE_URL}`);
  console.log(`Test Slug: ${TEST_SLUG}`);
  console.log('');

  try {
    console.log('📤 Starting upload...\n');

    const result = await uploadImageToSupabase(
      TEST_IMAGE_URL,
      TEST_SLUG,
      'featured',
      { format: 'avif', quality: 80 }
    );

    if (result) {
      console.log('\n✅ Upload successful!');
      console.log(`Public URL: ${result}`);
      console.log('');
      console.log('Next steps:');
      console.log('  1. Open the URL in your browser to verify');
      console.log('  2. Check Supabase Storage dashboard');
      console.log('  3. Run migration script if test is successful');
    } else {
      console.log('\n❌ Upload failed (returned null)');
      console.log('Check the logs above for error details');
    }

  } catch (error: any) {
    console.error('\n❌ Upload failed with error:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testUpload()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
