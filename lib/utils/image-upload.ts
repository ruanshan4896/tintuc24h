import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

// Lazy initialization of Supabase client
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin;
}

export interface ImageUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'avif' | 'webp' | 'jpeg';
}

/**
 * Upload image to Supabase Storage with optimization
 * @param imageUrl - URL of the image to download and upload
 * @param articleSlug - Article slug for file naming
 * @param type - Image type (featured, content, thumbnail)
 * @param options - Image optimization options
 * @returns Public URL of uploaded image or null if failed
 */
export async function uploadImageToSupabase(
  imageUrl: string,
  articleSlug: string,
  type: 'featured' | 'content' | 'thumbnail' = 'featured',
  options: ImageUploadOptions = {}
): Promise<string | null> {
  try {
    const {
      maxWidth = 1200,
      maxHeight = 630,
      quality = 80,
      format = 'avif'
    } = options;

    console.log(`📥 Downloading image: ${imageUrl.substring(0, 80)}...`);

    // 1. Download image with proper headers
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*',
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`🔄 Converting to ${format.toUpperCase()}...`);

    // 2. Optimize and convert image
    let sharpInstance = sharp(buffer)
      .resize(maxWidth, maxHeight, {
        fit: 'cover',
        position: 'center',
        withoutEnlargement: true, // Don't upscale small images
      });

    // Apply format-specific optimization
    let optimizedBuffer: Buffer;
    let contentType: string;
    let extension: string;

    switch (format) {
      case 'avif':
        optimizedBuffer = await sharpInstance
          .avif({ quality, effort: 4 }) // effort 4 = good balance
          .toBuffer();
        contentType = 'image/avif';
        extension = 'avif';
        break;
      case 'webp':
        optimizedBuffer = await sharpInstance
          .webp({ quality, effort: 4 })
          .toBuffer();
        contentType = 'image/webp';
        extension = 'webp';
        break;
      case 'jpeg':
        optimizedBuffer = await sharpInstance
          .jpeg({ quality, progressive: true })
          .toBuffer();
        contentType = 'image/jpeg';
        extension = 'jpg';
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // 3. Generate unique filename
    const timestamp = Date.now();
    const sanitizedSlug = articleSlug.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    const fileName = `${type}/${sanitizedSlug}-${timestamp}.${extension}`;

    console.log(`☁️ Uploading to Supabase: ${fileName}`);

    // 4. Upload to Supabase Storage
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from('articles')
      .upload(fileName, optimizedBuffer, {
        contentType,
        cacheControl: '31536000', // 1 year cache
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      throw error;
    }

    // 5. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('articles')
      .getPublicUrl(fileName);

    console.log(`✅ Upload successful: ${publicUrl}`);

    return publicUrl;

  } catch (error: any) {
    console.error('❌ Image upload failed:', error.message);
    return null;
  }
}

/**
 * Delete image from Supabase Storage
 * @param imageUrl - Full public URL of the image
 * @returns true if deleted successfully
 */
export async function deleteImageFromSupabase(imageUrl: string): Promise<boolean> {
  try {
    // Extract file path from URL
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/articles\/(.+)$/);
    
    if (!pathMatch) {
      throw new Error('Invalid Supabase storage URL');
    }

    const filePath = pathMatch[1];

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage
      .from('articles')
      .remove([filePath]);

    if (error) {
      throw error;
    }

    console.log(`🗑️ Deleted image: ${filePath}`);
    return true;

  } catch (error: any) {
    console.error('❌ Image deletion failed:', error.message);
    return false;
  }
}

/**
 * Check if URL is from Supabase Storage
 */
export function isSupabaseStorageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('supabase.co') && 
           urlObj.pathname.includes('/storage/v1/object/public/');
  } catch {
    return false;
  }
}

/**
 * Get image size from Supabase Storage
 */
export async function getImageSize(imageUrl: string): Promise<number | null> {
  try {
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/articles\/(.+)$/);
    
    if (!pathMatch) {
      return null;
    }

    const filePath = pathMatch[1];

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from('articles')
      .list(filePath.split('/')[0], {
        search: filePath.split('/').pop(),
      });

    if (error || !data || data.length === 0) {
      return null;
    }

    return data[0].metadata?.size || null;

  } catch (error) {
    return null;
  }
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

/**
 * Upload all images in Markdown content to Supabase Storage
 * @param content - Markdown content with images
 * @param articleSlug - Article slug for file naming
 * @returns Updated content with Supabase URLs
 */
export async function uploadContentImages(
  content: string,
  articleSlug: string
): Promise<string> {
  try {
    // Extract all image URLs
    const imageUrls = extractImageUrls(content);
    
    if (imageUrls.length === 0) {
      console.log('  ℹ️  No external images found in content');
      return content;
    }

    console.log(`  📸 Found ${imageUrls.length} image(s) in content, uploading...`);

    let updatedContent = content;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      console.log(`    [${i + 1}/${imageUrls.length}] Uploading: ${imageUrl.substring(0, 60)}...`);

      try {
        const newUrl = await uploadImageToSupabase(
          imageUrl,
          `${articleSlug}-content-${i}`,
          'content',
          { format: 'avif', quality: 80, maxWidth: 1000, maxHeight: 800 }
        );

        if (newUrl) {
          updatedContent = replaceImageUrl(updatedContent, imageUrl, newUrl);
          console.log(`      ✅ Uploaded successfully`);
          successCount++;
        } else {
          console.warn(`      ⚠️ Upload failed, keeping original URL`);
          failCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error: any) {
        console.error(`      ❌ Upload error: ${error.message}`);
        failCount++;
        // Keep original URL on error
      }
    }

    console.log(`  📊 Content images: ${successCount} uploaded, ${failCount} failed`);
    return updatedContent;

  } catch (error: any) {
    console.error('❌ Error processing content images:', error.message);
    return content; // Return original content on error
  }
}
