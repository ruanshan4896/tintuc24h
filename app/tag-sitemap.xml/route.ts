import { NextResponse } from 'next/server';
import { getArticlesServer } from '@/lib/api/articles-server';

/**
 * Tag Sitemap - All unique tags
 */
export const revalidate = 3600; // 1 hour

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

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tintuc.vercel.app';
  const currentDate = new Date().toISOString();

  try {
    // Get all published articles
    const articles = await getArticlesServer(true);

    // Extract all unique tags
    const tagsSet = new Set<string>();
    articles.forEach((article) => {
      if (article.tags && Array.isArray(article.tags)) {
        article.tags.forEach((tag: string) => {
          if (tag && tag.trim()) {
            tagsSet.add(tag.toLowerCase().trim());
          }
        });
      }
    });

    const uniqueTags = Array.from(tagsSet).sort();
    console.log(`🏷️ Tag Sitemap: Generating for ${uniqueTags.length} tags`);

    // Generate slug for each tag
    const generateTagSlug = (tag: string): string => {
      return tag
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    };

    // Generate XML with error handling
    const urls = uniqueTags
      .map((tag) => {
        try {
          const slug = generateTagSlug(tag);
          
          if (!slug) {
            console.warn(`⚠️ Skipping empty tag: ${tag}`);
            return '';
          }
          
          const url = `${baseUrl}/tag/${slug}`;
          const escapedUrl = escapeUrl(url);
          
          if (!escapedUrl) {
            console.warn(`⚠️ Invalid URL for tag: ${tag}`);
            return '';
          }
          
          return `  <url>
    <loc>${escapedUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
        } catch (err: any) {
          console.warn(`⚠️ Error processing tag ${tag}: ${err.message}`);
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
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERROR GENERATING TAG SITEMAP');
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

