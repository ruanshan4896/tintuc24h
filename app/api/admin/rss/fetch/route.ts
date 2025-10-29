import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import Parser from 'rss-parser';
import TurndownService from 'turndown';
import type { RssImportResult } from '@/lib/types/rss';
import { scrapeFullArticle, extractMainImage } from '@/lib/utils/scraper';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)',
  },
});

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

// Helper function to clean and convert HTML to Markdown
function htmlToMarkdown(html: string): string {
  if (!html) return '';
  
  try {
    // Remove scripts and styles
    let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Convert to markdown
    const markdown = turndownService.turndown(cleaned);
    
    // Clean up extra whitespace
    return markdown.replace(/\n{3,}/g, '\n\n').trim();
  } catch (error) {
    console.error('Error converting HTML to Markdown:', error);
    return html;
  }
}

// Helper function to extract image URL from content
function extractImageUrl(content: string, enclosure?: { url?: string }): string | null {
  // Try enclosure first
  if (enclosure?.url && (enclosure.url.endsWith('.jpg') || enclosure.url.endsWith('.png') || enclosure.url.endsWith('.webp'))) {
    return enclosure.url;
  }
  
  // Try to find image in content
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }
  
  return null;
}

// Helper function to generate slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

// POST - Fetch and import RSS feed
export async function POST(request: NextRequest) {
  try {
    const { feedId, scrapeFullContent = false } = await request.json();

    if (!feedId) {
      return NextResponse.json(
        { error: 'Feed ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching RSS feed:', { feedId, scrapeFullContent });

    // Get feed details
    const { data: feed, error: feedError } = await supabaseAdmin
      .from('rss_feeds')
      .select('*')
      .eq('id', feedId)
      .single();

    if (feedError || !feed) {
      return NextResponse.json(
        { error: 'RSS feed not found' },
        { status: 404 }
      );
    }

    if (!feed.active) {
      return NextResponse.json(
        { error: 'RSS feed is inactive' },
        { status: 400 }
      );
    }

    const result: RssImportResult = {
      success: false,
      feedName: feed.name,
      totalItems: 0,
      newArticles: 0,
      skippedItems: 0,
      errors: [],
    };

    // Fetch RSS feed
    let rssFeed;
    try {
      rssFeed = await parser.parseURL(feed.url);
    } catch (error: any) {
      result.errors.push(`Failed to fetch RSS: ${error.message}`);
      return NextResponse.json(result, { status: 500 });
    }

    result.totalItems = rssFeed.items.length;

    // Process each RSS item
    for (const item of rssFeed.items.slice(0, 10)) { // Limit to 10 items per fetch
      try {
        const itemUrl = item.link || item.guid;
        if (!itemUrl) {
          result.skippedItems++;
          continue;
        }

        // Check if already imported
        const { data: existingItem } = await supabaseAdmin
          .from('rss_feed_items')
          .select('id')
          .eq('original_url', itemUrl)
          .single();

        if (existingItem) {
          result.skippedItems++;
          continue;
        }

        // Prepare article data
        let title = item.title || 'Untitled';
        let description = item.contentSnippet || item.summary || '';
        let content = htmlToMarkdown(item.content || item['content:encoded'] || item.summary || '');
        let imageUrl = extractImageUrl(item.content || '', item.enclosure);
        let author = feed.name;

        // Scrape full content if enabled
        if (scrapeFullContent && itemUrl) {
          try {
            console.log(`🕷️ Scraping full content for: ${title.substring(0, 50)}...`);
            const scrapedArticle = await scrapeFullArticle(itemUrl);
            
            if (scrapedArticle) {
              // Use scraped content
              if (scrapedArticle.content && scrapedArticle.content.length > content.length) {
                content = scrapedArticle.content;
                console.log(`✅ Used scraped content (${scrapedArticle.content.length} chars)`);
              }
              
              // Use better title if available
              if (scrapedArticle.title && scrapedArticle.title.length > 0) {
                title = scrapedArticle.title;
              }
              
              // Use better excerpt if available
              if (scrapedArticle.excerpt && scrapedArticle.excerpt.length > description.length) {
                description = scrapedArticle.excerpt;
              }
              
              // Use author if available
              if (scrapedArticle.author) {
                author = `${scrapedArticle.author} (${feed.name})`;
              }
              
              // Try to get better image
              if (!imageUrl) {
                const scrapedImage = await extractMainImage(itemUrl);
                if (scrapedImage) {
                  imageUrl = scrapedImage;
                }
              }
            }
          } catch (scrapeError: any) {
            console.warn('Failed to scrape article:', scrapeError.message);
            // Continue with RSS content if scraping fails
          }
        }

        const slug = generateSlug(title);

        // Create article
        const { data: article, error: articleError } = await supabaseAdmin
          .from('articles')
          .insert({
            title,
            slug,
            description: description.substring(0, 500),
            content,
            image_url: imageUrl,
            category: feed.category,
            author,
            published: false, // Set to false for manual review
            tags: [],
          })
          .select()
          .single();

        if (articleError) {
          result.errors.push(`Failed to create article "${title}": ${articleError.message}`);
          continue;
        }

        // Track imported item
        await supabaseAdmin
          .from('rss_feed_items')
          .insert({
            feed_id: feedId,
            article_id: article.id,
            original_url: itemUrl,
          });

        result.newArticles++;
      } catch (error: any) {
        result.errors.push(`Error processing item: ${error.message}`);
      }
    }

    // Update last_fetched timestamp
    await supabaseAdmin
      .from('rss_feeds')
      .update({ last_fetched: new Date().toISOString() })
      .eq('id', feedId);

    result.success = true;

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RSS feed', details: error.message },
      { status: 500 }
    );
  }
}

