import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import Parser from 'rss-parser';
import TurndownService from 'turndown';
import type { RssImportResult } from '@/lib/types/rss';
import { scrapeFullArticle, extractMainImage } from '@/lib/utils/scraper';
import { addKeywordLinks } from '@/lib/utils/keyword-linking';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Increase route timeout for RSS fetching + AI processing (Vercel allows up to 60s on Hobby plan)
export const maxDuration = 60; // seconds

const parser = new Parser({
  timeout: 30000, // 30 seconds for RSS parsing
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)',
  },
});

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

// Helper function to decode HTML entities
function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": "\"",
    "&#039;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
    "&mdash;": "—",
    "&ndash;": "–",
    "&hellip;": "…",
    "&lsquo;": "'",
    "&rsquo;": "'",
    "&ldquo;": '"',
    "&rdquo;": '"',
  };

  // Replace named entities
  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }

  // Replace numeric entities (&#123; or &#xAB;)
  decoded = decoded.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  return decoded;
}

// Helper function to get all available Google AI keys
function getGoogleAIKeys(): string[] {
  const keys: string[] = [];
  let i = 1;
  
  // Check for numbered keys (GOOGLE_AI_API_KEY_1, GOOGLE_AI_API_KEY_2, ...)
  while (true) {
    const key = process.env[`GOOGLE_AI_API_KEY_${i}`];
    if (key) {
      keys.push(key);
      i++;
    } else {
      break;
    }
  }
  
  // Fallback to single key if no numbered keys found
  if (keys.length === 0 && process.env.GOOGLE_AI_API_KEY) {
    keys.push(process.env.GOOGLE_AI_API_KEY);
  }
  
  return keys;
}

// Helper function to generate meaningful image caption AND alt text using AI
async function generateImageCaptionAndAlt(
  articleTitle: string
): Promise<{ caption: string; alt: string }> {
  try {
    // Get ALL available Google AI keys
    const googleApiKeys = getGoogleAIKeys();
    
    if (googleApiKeys.length === 0) {
      console.warn('⚠️ No Google AI key, using default caption & alt');
      // Fallback: Simple caption and alt based on title
      const mainTopic = articleTitle.split(':')[0].trim();
      return {
        caption: articleTitle.length > 60 ? articleTitle.substring(0, 60) + '...' : articleTitle,
        alt: mainTopic
      };
    }

    console.log(`🔑 Caption Gen: ${googleApiKeys.length} keys available`);

    // Generate BOTH caption (for display) and alt text (for SEO/accessibility)
    const prompt = `Tạo chú thích (caption) và mô tả thay thế (alt text) cho hình ảnh minh họa trong bài viết tin tức.

Tiêu đề bài viết: "${articleTitle}"

YÊU CẦU:
1. CAPTION (8-12 từ): Câu mô tả ngắn gọn, chuyên nghiệp về chủ đề bài viết
2. ALT (5-8 từ): Mô tả ngắn cho SEO/accessibility, chứa keywords chính

Format trả về (BẮT BUỘC):
CAPTION: [câu caption ở đây]
ALT: [mô tả alt ở đây]

VÍ DỤ:
Input: "iPhone 15 Ra Mắt Với Chip A17 Pro Mạnh Mẽ"
CAPTION: Công nghệ smartphone mới nhất từ Apple
ALT: iPhone 15 chip A17 Pro

Input: "VinFast VF 7 Hoàn Thành Hành Trình 50.000km"
CAPTION: Xe điện Việt Nam chinh phục thị trường quốc tế
ALT: Xe điện VinFast VF 7

Input: "Ronaldo Ghi Bàn Thắng Thứ 900 Trong Sự Nghiệp"
CAPTION: Huyền thoại bóng đá chinh phục cột mốc lịch sử
ALT: Cristiano Ronaldo bóng đá

Trả về NGAY theo format (KHÔNG giải thích):`;

    // Try each key until one succeeds
    let result;
    let response;
    let lastError;
    
    for (let keyIndex = 0; keyIndex < googleApiKeys.length; keyIndex++) {
      const selectedKey = googleApiKeys[keyIndex];
      const keyNumber = keyIndex + 1;
      
      try {
        console.log(`🔑 Trying Key #${keyNumber}/${googleApiKeys.length}...`);
        
        const genAI = new GoogleGenerativeAI(selectedKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
        
        result = await model.generateContent(prompt);
        response = result.response.text().trim();
        
        console.log(`✅ Success with Key #${keyNumber}`);
        break; // Success! Exit loop
        
      } catch (error: any) {
        // Check if it's a quota error (429)
        const isQuotaError = error.message?.includes('429') || 
                             error.message?.includes('quota') ||
                             error.message?.includes('Too Many Requests');
        
        if (isQuotaError) {
          console.log(`⚠️ Key #${keyNumber} quota exceeded, trying next key...`);
          lastError = error;
          continue; // Try next key
        } else {
          // Other errors, throw immediately
          throw error;
        }
      }
    }
    
    // If all keys failed with quota error
    if (!response) {
      throw lastError || new Error('All Google AI keys quota exceeded');
    }
    
    // Parse response
    const captionMatch = response.match(/CAPTION:\s*(.+)/i);
    const altMatch = response.match(/ALT:\s*(.+)/i);
    
    if (captionMatch && altMatch) {
      const caption = captionMatch[1].replace(/^["']|["']$/g, '').trim();
      const alt = altMatch[1].replace(/^["']|["']$/g, '').trim();
      
      console.log(`✅ Generated for "${articleTitle.substring(0, 50)}..."`);
      console.log(`   Caption: "${caption}"`);
      console.log(`   Alt: "${alt}"`);
      
      return { caption, alt };
    } else {
      // Fallback if parsing fails
      console.warn('⚠️ Could not parse AI response, using fallback');
      const mainTopic = articleTitle.split(':')[0].trim();
      return {
        caption: response.split('\n')[0].trim() || mainTopic,
        alt: mainTopic
      };
    }
    
  } catch (error: any) {
    console.error('❌ Error generating caption & alt:', error.message);
    // Fallback: Extract main topic from title
    const mainTopic = articleTitle.split(':')[0].trim();
    return {
      caption: `Hình minh họa: ${mainTopic}`,
      alt: mainTopic
    };
  }
}

// Helper function to clean and convert HTML to Markdown
function htmlToMarkdown(html: string): string {
  if (!html) return '';
  
  try {
    // Remove scripts and styles
    let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Convert to markdown
    const markdown = turndownService.turndown(cleaned);
    
    // Decode HTML entities
    const decodedMarkdown = decodeHtmlEntities(markdown);
    
    // Clean up extra whitespace
    return decodedMarkdown.replace(/\n{3,}/g, '\n\n').trim();
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
        let title = decodeHtmlEntities(item.title || 'Untitled');
        let description = decodeHtmlEntities(item.contentSnippet || item.summary || '');
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

        // Use scraped image if available (NO Unsplash!)
        if (imageUrl) {
          console.log(`🖼️ Using scraped image: ${imageUrl}`);
          
          // Generate AI caption & alt for scraped image
          const { caption, alt } = await generateImageCaptionAndAlt(title);
          
          // Replace IMAGE_PLACEHOLDER_1 with scraped image
          if (finalContent.includes('[IMAGE_PLACEHOLDER_1]')) {
            const imageMarkdown = `\n\n![${alt}](${imageUrl})\n*${caption}*\n`;
            finalContent = finalContent.replace('[IMAGE_PLACEHOLDER_1]', imageMarkdown);
            console.log(`✅ Replaced [IMAGE_PLACEHOLDER_1] with scraped image + AI caption & alt`);
          } else {
            // If no placeholder, insert after first heading
            const firstHeadingMatch = finalContent.match(/^##\s.+$/m);
            if (firstHeadingMatch) {
              const insertPosition = firstHeadingMatch.index! + firstHeadingMatch[0].length;
              const imageMarkdown = `\n\n![${alt}](${imageUrl})\n*${caption}*\n`;
              finalContent = finalContent.slice(0, insertPosition) + imageMarkdown + finalContent.slice(insertPosition);
              console.log(`✅ Inserted scraped image after first heading + AI caption & alt`);
            }
          }
        } else {
          console.warn('⚠️ No image available from scraping');
        }

        // Remove any remaining placeholders (if any)
        finalContent = finalContent.replace(/\[IMAGE_PLACEHOLDER_\d+\]/g, '');

        // Auto Keyword Linking: Add internal links to related articles
        console.log('🔗 Adding keyword links...');
        // Generate temporary ID for new article (use slug as identifier)
        // Note: We'll do a post-process after article is created
        const tempArticleId = 'temp-' + Date.now();
        
        // Add keyword links to content (use AI-generated tags as keywords)
        finalContent = await addKeywordLinks(finalContent, title, tempArticleId, aiTags);

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

    // Revalidate sitemap if new articles were created
    if (result.newArticles > 0) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        await fetch(`${baseUrl}/api/admin/revalidate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: '/post-sitemap.xml' }),
        });
        console.log('✅ Sitemap revalidated after RSS fetch');
      } catch (revalError) {
        console.warn('⚠️ Could not revalidate sitemap:', revalError);
      }
    }

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

