import { NextResponse } from 'next/server';
import { getArticlesServer } from '@/lib/api/articles-server';

/**
 * Tag Sitemap - All unique tags
 */
export const revalidate = 3600; // 1 hour

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

    // Generate XML
    const urls = uniqueTags
      .map((tag) => {
        const slug = generateTagSlug(tag);
        return `  <url>
    <loc>${baseUrl}/tag/${slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
      })
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
  } catch (error) {
    console.error('❌ Error generating tag sitemap:', error);
    
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

