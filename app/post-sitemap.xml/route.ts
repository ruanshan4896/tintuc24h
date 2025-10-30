import { NextResponse } from 'next/server';
import { getArticlesServer } from '@/lib/api/articles-server';

/**
 * Post Sitemap - All articles/posts
 * Updates every hour with ISR
 */
export const revalidate = 3600; // 1 hour

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tintuc.vercel.app';

  try {
    console.log('📰 Post Sitemap: Starting generation...');
    console.log('Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      baseUrl,
    });
    
    // Get all published articles
    const articles = await getArticlesServer(true);
    console.log(`📰 Post Sitemap: Found ${articles.length} articles`);
    
    if (!articles || articles.length === 0) {
      console.warn('⚠️ No articles found! Returning empty sitemap.');
      const emptySitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
      return new NextResponse(emptySitemap, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
        },
      });
    }

    // Generate XML
    const urls = articles
      .map((article) => {
        const lastmod = new Date(article.updated_at || article.created_at).toISOString();
        return `  <url>
    <loc>${baseUrl}/articles/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${article.image_url || `${baseUrl}/og-image.jpg`}</image:loc>
      <image:title>${escapeXml(article.title)}</image:title>
    </image:image>
  </url>`;
      })
      .join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
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
    console.error('❌ ERROR GENERATING POST SITEMAP');
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
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

