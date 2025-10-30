import { NextResponse } from 'next/server';

/**
 * Page Sitemap - Static pages (Homepage, Search, etc.)
 */
export const revalidate = 86400; // 24 hours

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
  
  try {
    console.log('📄 Page Sitemap: Starting generation...');
    
    const currentDate = new Date().toISOString();

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeUrl(`${baseUrl}/`)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${escapeUrl(`${baseUrl}/search`)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
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
    console.error('❌ ERROR GENERATING PAGE SITEMAP');
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

