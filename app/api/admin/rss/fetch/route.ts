import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import Parser from 'rss-parser';
import TurndownService from 'turndown';
import type { RssImportResult } from '@/lib/types/rss';
import { scrapeFullArticle, extractMainImage } from '@/lib/utils/scraper';
import { searchUnsplashImages, extractImageKeywords } from '@/lib/utils/unsplash';

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
  let feedId: string | undefined;
  
  try {
    const body = await request.json();
    feedId = body.feedId;
    const scrapeFullContent = body.scrapeFullContent || false;
    const aiRewrite = body.aiRewrite || false;
    const aiProvider = body.aiProvider || 'google';

    console.log('═══════════════════════════════════════════════');
    console.log('📡 RSS FETCH STARTED');
    console.log('═══════════════════════════════════════════════');
    console.log('Feed ID:', feedId);
    console.log('Scrape Full Content:', scrapeFullContent);
    console.log('AI Rewrite:', aiRewrite);
    console.log('AI Provider:', aiProvider);

    if (!feedId) {
      return NextResponse.json(
        { error: 'Feed ID is required' },
        { status: 400 }
      );
    }

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
        // Fixed author for all articles on the website
        const author = 'Ctrl Z';

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
              
              // Author is fixed as "Ctrl Z" - no override from scraped content
              
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

        // AI Rewrite if enabled
        let finalContent = content;
        let finalDescription = description.substring(0, 500);
        let aiTags: string[] = [];
        
        console.log('🔍 Checking AI Rewrite conditions:');
        console.log('  - aiRewrite flag:', aiRewrite);
        console.log('  - content.length:', content.length);
        console.log('  - Should rewrite?', aiRewrite && content.length > 200);
        
        if (aiRewrite && content.length > 200) {
          try {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`🤖 AI REWRITE: ${title.substring(0, 50)}...`);
            console.log(`📊 Content length: ${content.length} chars`);
            console.log(`🎯 Provider: ${aiProvider}`);
            console.log('🚀 Calling AI Rewrite API...');
            
            const apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/ai-rewrite`;
            console.log('📡 API URL:', apiUrl);
            
                const rewriteRes = await fetch(apiUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title,
                    content,
                    tone: 'professional',
                    provider: aiProvider,
                    generateMetadata: true, // AI tạo title + description
                  }),
                });

            console.log('📥 Response status:', rewriteRes.status);

            if (rewriteRes.ok) {
              const rewriteData = await rewriteRes.json();
              console.log('📦 Response data:', rewriteData);
              
              if (rewriteData.rewrittenContent) {
                finalContent = rewriteData.rewrittenContent;
                
                // Use AI-generated SEO metadata
                if (rewriteData.seoTitle) {
                  title = rewriteData.seoTitle;
                  console.log(`📝 Using AI-generated SEO Title: ${title}`);
                }
                
                if (rewriteData.seoDescription) {
                  finalDescription = rewriteData.seoDescription;
                  console.log(`📝 Using AI-generated SEO Description: ${finalDescription}`);
                } else {
                  // Fallback: Extract from content
                  finalDescription = finalContent.substring(0, 155).replace(/[#*]/g, '').trim();
                }
                
                // Use AI-generated tags
                if (rewriteData.tags && Array.isArray(rewriteData.tags) && rewriteData.tags.length > 0) {
                  aiTags = rewriteData.tags;
                  console.log(`🏷️ Using AI-generated tags:`, aiTags);
                }
                
                console.log(`✅ AI Rewrite SUCCESS!`);
                console.log(`  - Tokens: ${rewriteData.tokensUsed}`);
                console.log(`  - Cost: ${rewriteData.cost}`);
                console.log(`  - Original: ${content.length} chars`);
                console.log(`  - Rewritten: ${finalContent.length} chars`);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              } else {
                console.warn('⚠️ No rewritten content in response');
              }
            } else {
              const errorText = await rewriteRes.text();
              console.error('❌ AI Rewrite HTTP error:', rewriteRes.status);
              console.error('Error response:', errorText);
              console.warn('⚠️ AI Rewrite failed, using original content');
            }
          } catch (aiError: any) {
            console.error('❌ AI Rewrite exception:', aiError);
            console.error('Error details:', {
              message: aiError.message,
              stack: aiError.stack,
            });
            console.warn('⚠️ Using original content due to error');
          }
        } else {
          console.log('⏭️ Skipping AI Rewrite (disabled or content too short)');
        }

        // Search and insert Unsplash images
        console.log('🖼️ Searching for images from Unsplash...');
        const imageKeywords = await extractImageKeywords(title);
        const unsplashImages = await searchUnsplashImages(imageKeywords, 2);

        if (unsplashImages && unsplashImages.length > 0) {
          // Use first image as featured image (if no image from RSS)
          if (!imageUrl) {
            imageUrl = unsplashImages[0].url;
            console.log(`✅ Using Unsplash image as featured: ${imageUrl}`);
          }

          // Insert first image after first heading (## ) or at the beginning
          const firstHeadingMatch = finalContent.match(/^##\s.+$/m);
          if (firstHeadingMatch) {
            const insertPosition = firstHeadingMatch.index! + firstHeadingMatch[0].length;
            const imageMarkdown = `\n\n![${unsplashImages[0].alt}](${unsplashImages[0].url})\n*${unsplashImages[0].credit}*\n`;
            finalContent = finalContent.slice(0, insertPosition) + imageMarkdown + finalContent.slice(insertPosition);
            console.log(`✅ Inserted 1 Unsplash image into content`);
          } else {
            // Insert at beginning if no heading found
            const imageMarkdown = `![${unsplashImages[0].alt}](${unsplashImages[0].url})\n*${unsplashImages[0].credit}*\n\n`;
            finalContent = imageMarkdown + finalContent;
            console.log(`✅ Inserted 1 Unsplash image at beginning`);
          }
        } else {
          console.warn('⚠️ No images found from Unsplash');
        }

        // Create article
        const { data: article, error: articleError } = await supabaseAdmin
          .from('articles')
          .insert({
            title,
            slug,
            description: finalDescription,
            content: finalContent,
            image_url: imageUrl,
            category: feed.category,
            author,
            published: false, // Set to false for manual review
            tags: aiTags.length > 0 ? aiTags : [],
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
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERROR FETCHING RSS FEED');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error Type:', error.constructor?.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Feed ID:', feedId);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return NextResponse.json(
      { 
        error: 'Không thể fetch RSS feed', 
        details: error.message,
        type: error.constructor?.name,
      },
      { status: 500 }
    );
  }
}

