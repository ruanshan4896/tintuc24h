import { NextResponse } from 'next/server';
import { getArticlesServer } from '@/lib/api/articles-server';
import { CATEGORIES } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tintuc24h-seven.vercel.app';
    const siteName = 'Ctrl Z';
    const siteDescription = 'Ctrl Z - Tin tức minh bạch, đa chiều. Hoàn tác tin giả, khôi phục sự thật.';

    // Get latest published articles then limit to 50 (server API accepts only "published" flag)
    const allArticles = (await getArticlesServer(true)).slice(0, 50);
    
    // Sort by created_at descending (newest first)
    const sortedArticles = allArticles.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Build RSS XML
    const rssItems = sortedArticles.map(article => {
      const articleUrl = `${baseUrl}/articles/${article.slug}`;
      const pubDate = new Date(article.created_at).toUTCString();
      const description = article.description || article.content.substring(0, 200) + '...';
      
      // Escape XML special characters
      const escapeXml = (text: string) => {
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
      };

      const imageTag = article.image_url 
        ? `<enclosure url="${escapeXml(article.image_url)}" type="image/jpeg" />`
        : '';

      return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <description>${escapeXml(description)}</description>
      <category>${escapeXml(article.category)}</category>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(article.author)}</author>
      ${imageTag}
    </item>`;
    }).join('\n');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${siteName}</title>
    <link>${baseUrl}</link>
    <description>${siteDescription}</description>
    <language>vi-VN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <ttl>60</ttl>
    <image>
      <url>${baseUrl}/og-image.jpg</url>
      <title>${siteName}</title>
      <link>${baseUrl}</link>
    </image>
${rssItems}
  </channel>
</rss>`;

    return new NextResponse(rssXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=60',
      },
    });

  } catch (error: any) {
    console.error('Error generating RSS feed:', error);
    return new NextResponse('Error generating RSS feed', { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}

