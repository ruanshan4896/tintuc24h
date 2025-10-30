import { NextResponse } from 'next/server';
import { CATEGORIES } from '@/lib/constants';

/**
 * Category Sitemap - All category pages
 */
export const revalidate = 86400; // 24 hours

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tintuc.vercel.app';
  
  try {
    console.log('📂 Category Sitemap: Starting generation...');
    console.log(`📂 Category Sitemap: Found ${CATEGORIES.length} categories`);
    
    const currentDate = new Date().toISOString();

    // Generate category URLs with error handling
    const urls = CATEGORIES
      .map((category) => {
        try {
          const slug = category
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'd')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-'); // Remove duplicate hyphens

          if (!slug) {
            console.warn(`⚠️ Skipping empty category: ${category}`);
            return '';
          }

          const url = `${baseUrl}/category/${slug}`;
          const escapedUrl = escapeUrl(url);
          
          if (!escapedUrl) {
            console.warn(`⚠️ Invalid URL for category: ${category}`);
            return '';
          }

          return `  <url>
    <loc>${escapedUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
        } catch (err: any) {
          console.warn(`⚠️ Error processing category ${category}: ${err.message}`);
          return '';
        }
      })
      .filter(Boolean)
      .join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERROR GENERATING CATEGORY SITEMAP');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error Type:', error.constructor?.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Return empty sitemap on error
    const emptySitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;

    return new NextResponse(emptySitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}

/**
 * Escape URL for XML
 */
function escapeUrl(url: string): string {
  if (!url) return '';
  
  try {
    // Validate URL first
    new URL(url);
    return url
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  } catch {
    return ''; // Invalid URL
  }
}

