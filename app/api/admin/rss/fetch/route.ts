import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import Parser from 'rss-parser';
import TurndownService from 'turndown';
import type { RssImportResult } from '@/lib/types/rss';
import { scrapeFullArticle, extractMainImage } from '@/lib/utils/scraper';
import { getCategorySlug, toSlug } from '@/lib/utils/slug';
import { triggerRevalidate } from '@/lib/api/revalidate';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Increase route timeout for RSS fetching + AI processing (Vercel allows up to 60s on Hobby plan)
export const maxDuration = 60; // seconds

const parser = new Parser({
  timeout: 30000, // 30 seconds for RSS parsing
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
    'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
  },
  // Enable custom fields to handle various feed formats
  customFields: {
    item: [
      ['content:encoded', 'content'],
      ['description', 'description'],
      ['summary', 'summary'],
      ['guid', 'guid'],
      ['link', 'link'],
      ['pubDate', 'pubDate'],
      ['published', 'published'],
      ['updated', 'updated'],
    ],
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

// Track round-robin index for caption generation keys
let currentCaptionKeyIndex = 0;
const exhaustedCaptionKeys = new Map<string, number>();
const CAPTION_EXHAUST_TTL_MS = 5 * 60 * 1000; // 5 minutes (reduced from 15 to allow faster recovery)

function isCaptionKeyExhausted(key: string): boolean {
  const expireAt = exhaustedCaptionKeys.get(key);
  if (!expireAt) return false;
  if (Date.now() > expireAt) {
    exhaustedCaptionKeys.delete(key);
    return false;
  }
  return true;
}

function markCaptionKeyExhausted(key: string) {
  exhaustedCaptionKeys.set(key, Date.now() + CAPTION_EXHAUST_TTL_MS);
}

// Clean up expired exhausted keys
function cleanupCaptionExhaustedKeys() {
  const now = Date.now();
  for (const [key, expireAt] of exhaustedCaptionKeys.entries()) {
    if (now > expireAt) {
      exhaustedCaptionKeys.delete(key);
    }
  }
}

// Helper function to generate meaningful image caption AND alt text using AI
async function generateImageCaptionAndAlt(
  articleTitle: string
): Promise<{ caption: string; alt: string }> {
  try {
    // Allow disabling caption generation via env
    if (process.env.IMAGE_CAPTION_ENABLED === 'false') {
      const mainTopic = articleTitle.split(':')[0].trim();
      return {
        caption: articleTitle.length > 60 ? articleTitle.substring(0, 60) + '...' : articleTitle,
        alt: mainTopic
      };
    }

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

    // Clean up expired exhausted keys before starting
    cleanupCaptionExhaustedKeys();
    
    // Try each key until one succeeds (round-robin rotation)
    let result;
    let response;
    let lastError;
    
    // Count how many keys are available (not exhausted)
    const availableCaptionKeys = googleApiKeys.filter(key => !isCaptionKeyExhausted(key));
    const allCaptionKeysExhausted = availableCaptionKeys.length === 0;
    
    if (allCaptionKeysExhausted) {
      console.log('⚠️ All caption keys are exhausted, but will force retry anyway (may have reset)...');
      // Clear all exhausted flags to force retry
      exhaustedCaptionKeys.clear();
    }
    
    for (let attempt = 0; attempt < googleApiKeys.length; attempt++) {
      const keyIndex = (currentCaptionKeyIndex + attempt) % googleApiKeys.length;
      const selectedKey = googleApiKeys[keyIndex];
      const keyNumber = keyIndex + 1;

      // Skip temporarily exhausted keys (unless all are exhausted, then force retry)
      if (!allCaptionKeysExhausted && isCaptionKeyExhausted(selectedKey)) {
        console.log(`⏭️ Skipping Caption Key #${keyNumber} (temporarily exhausted)`);
        continue;
      }
      
      if (allCaptionKeysExhausted) {
        console.log(`🔄 Force retrying Caption Key #${keyNumber} (all keys were exhausted, may have reset)...`);
      }
      
      try {
        console.log(`🔑 Trying Key #${keyNumber}/${googleApiKeys.length}...`);
        
        const genAI = new GoogleGenerativeAI(selectedKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
        
        result = await model.generateContent(prompt);
        response = result.response.text().trim();
        
        console.log(`✅ Success with Key #${keyNumber}`);
        currentCaptionKeyIndex = (keyIndex + 1) % googleApiKeys.length;
        break; // Success! Exit loop
        
      } catch (error: any) {
        // Check if it's a quota error (429)
        const isQuotaError = error.message?.includes('429') || 
                             error.message?.includes('quota') ||
                             error.message?.includes('Too Many Requests');
        
        if (isQuotaError) {
          console.log(`⚠️ Key #${keyNumber} quota exceeded, trying next key...`);
          markCaptionKeyExhausted(selectedKey);
          lastError = error;
          await new Promise(r => setTimeout(r, 150));
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

    const revalidateTargets: {
      slug: string;
      category?: string | null;
      tags?: string[] | null;
    }[] = [];

    // Fetch RSS feed
    let rssFeed;
    try {
      console.log(`📡 Fetching RSS feed from: ${feed.url}`);
      
      // Try to parse the feed with rss-parser
      try {
        rssFeed = await parser.parseURL(feed.url);
      } catch (parseError: any) {
        // If parser fails, try fetching directly and parsing manually
        if (parseError.message?.includes('not recognized as RSS 1 or 2') || 
            parseError.message?.includes('Feed not recognized')) {
          console.warn('⚠️ RSS parser failed, trying direct fetch with manual parse...');
          
          // Fetch feed content directly with redirect handling
          const response = await fetch(feed.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
              'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
              'Referer': feed.url,
              'Cache-Control': 'no-cache',
            },
            redirect: 'follow', // Follow redirects
            signal: AbortSignal.timeout(30000),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const feedContent = await response.text();
          const contentType = response.headers.get('content-type') || '';
          const trimmedContent = feedContent.trim();
          
          console.log(`📄 Response Content-Type: ${contentType}`);
          console.log(`📄 Response preview (first 500 chars): ${trimmedContent.substring(0, 500)}`);
          
          // Check if it's actually XML/RSS
          const isXml = trimmedContent.startsWith('<?xml');
          const isRss = trimmedContent.includes('<rss') || trimmedContent.includes('<channel');
          const isAtom = trimmedContent.includes('<feed') || trimmedContent.includes('<atom:feed');
          const isHtml = trimmedContent.startsWith('<!DOCTYPE') || trimmedContent.startsWith('<html');
          
          if (isHtml) {
            console.warn('⚠️ Response is HTML, not RSS/XML. May need different approach.');
            
            // Try multiple strategies to find RSS feed
            
            // Strategy 1: Extract RSS feed URL from HTML (meta tags, links, etc.)
            const rssLinkMatch = feedContent.match(/<link[^>]*type=["']application\/rss\+xml["'][^>]*href=["']([^"']+)["']/i) ||
                                 feedContent.match(/<link[^>]*href=["']([^"']+)["'][^>]*type=["']application\/rss\+xml["']/i) ||
                                 feedContent.match(/<link[^>]*rel=["']alternate["'][^>]*type=["']application\/rss\+xml["'][^>]*href=["']([^"']+)["']/i) ||
                                 feedContent.match(/<link[^>]*href=["']([^"']+\.rss[^"']*)["'][^>]*/i);
            
            let alternateUrls: string[] = [];
            
            // Strategy 2: Try common RSS feed URL patterns
            const urlObj = new URL(feed.url);
            const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
            const pathParts = urlObj.pathname.split('/').filter(p => p);
            
            // Common RSS patterns to try
            const commonPatterns = [
              `${baseUrl}/rss.xml`,
              `${baseUrl}/feed.xml`,
              `${baseUrl}/feed`,
              `${baseUrl}/rss`,
              `${baseUrl}/feeds/all.rss`,
              feed.url.replace('.rss', '/feed'),
              feed.url.replace('/rss/', '/feed/'),
            ];
            
            // Vietnamese news sites specific patterns
            if (baseUrl.includes('.vn')) {
              commonPatterns.push(
                `${baseUrl}/index.rss`,
                `${baseUrl}/tin-moi.rss`,
                `${baseUrl}/rss-feed.xml`,
              );
            }
            
            if (pathParts.length > 0) {
              const category = pathParts[pathParts.length - 1].replace('.rss', '');
              
              // Standard patterns
              commonPatterns.push(
                `${baseUrl}/rss/${category}`,
                `${baseUrl}/feed/${category}`,
                `${baseUrl}/rss/${category}.xml`,
                `${baseUrl}/feed/${category}.xml`,
              );
              
              // Try without .rss extension
              const categoryWithoutRss = category.replace(/\.rss$/, '');
              if (categoryWithoutRss !== category) {
                commonPatterns.push(
                  `${baseUrl}/rss/${categoryWithoutRss}`,
                  `${baseUrl}/feed/${categoryWithoutRss}`,
                );
              }
              
              // Try category at root level
              if (pathParts.length >= 2) {
                const categoryPath = pathParts[pathParts.length - 2];
                commonPatterns.push(
                  `${baseUrl}/${categoryPath}/rss`,
                  `${baseUrl}/${categoryPath}/feed`,
                );
              }
            }
            
            // Add found RSS link to alternatives
            if (rssLinkMatch && rssLinkMatch[1]) {
              let foundUrl = rssLinkMatch[1];
              // Convert relative URL to absolute
              if (foundUrl.startsWith('/')) {
                foundUrl = `${baseUrl}${foundUrl}`;
              } else if (!foundUrl.startsWith('http')) {
                foundUrl = `${baseUrl}/${foundUrl}`;
              }
              alternateUrls.push(foundUrl);
              console.log(`🔗 Found RSS URL in HTML: ${foundUrl}`);
            }
            
            // Add common patterns
            alternateUrls.push(...commonPatterns);
            
            // Try each alternate URL
            let success = false;
            const failedUrls: Array<{ url: string; status?: number; reason: string }> = [];
            
            for (const alternateUrl of alternateUrls) {
              if (alternateUrl === feed.url) continue; // Skip original URL
              
              try {
                console.log(`🔍 Trying alternate RSS URL: ${alternateUrl}`);
                
                const altResponse = await fetch(alternateUrl, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
                    'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Referer': feed.url,
                    'Cache-Control': 'no-cache',
                  },
                  redirect: 'follow',
                  signal: AbortSignal.timeout(15000), // Shorter timeout for alternatives
                });
                
                if (altResponse.ok) {
                  const altContent = await altResponse.text();
                  const altTrimmed = altContent.trim();
                  const contentType = altResponse.headers.get('content-type') || '';
                  
                  console.log(`📄 Alternate URL ${alternateUrl}: Content-Type=${contentType}, Length=${altContent.length}, Preview=${altTrimmed.substring(0, 200)}`);
                  
                  // Check if it's valid XML/RSS/Atom
                  // More thorough check - also check content-type header
                  const hasXmlDeclaration = altTrimmed.startsWith('<?xml');
                  const hasRssTags = altTrimmed.includes('<rss') || altTrimmed.includes('<channel');
                  const hasAtomTags = altTrimmed.includes('<feed') || altTrimmed.includes('<atom:feed');
                  const hasXmlContentType = contentType.includes('xml') || 
                                            contentType.includes('rss') || 
                                            contentType.includes('atom') ||
                                            contentType.includes('application/xml') ||
                                            contentType.includes('text/xml');
                  
                  // Also check if content looks like HTML (common false positive)
                  const looksLikeHtml = altTrimmed.startsWith('<!DOCTYPE') || 
                                       altTrimmed.startsWith('<html') ||
                                       (contentType.includes('html') && !hasXmlContentType);
                  
                  const looksLikeXml = (hasXmlDeclaration || hasRssTags || hasAtomTags || hasXmlContentType) && !looksLikeHtml;
                  
                  if (looksLikeXml) {
                    try {
                      rssFeed = await parser.parseString(altContent);
                      console.log(`✅ Successfully parsed feed from alternate URL: ${alternateUrl}`);
                      success = true;
                      break; // Success! Exit loop
                    } catch (parseErr: any) {
                      console.warn(`⚠️ Failed to parse alternate URL ${alternateUrl}:`, parseErr.message);
                      failedUrls.push({ url: alternateUrl, status: altResponse.status, reason: `Parse error: ${parseErr.message}` });
                      continue; // Try next URL
                    }
                  } else {
                    failedUrls.push({ url: alternateUrl, status: altResponse.status, reason: 'Not XML/RSS/Atom format' });
                    console.warn(`⚠️ Alternate URL ${alternateUrl} returned non-XML content (${contentType})`);
                  }
                } else {
                  failedUrls.push({ url: alternateUrl, status: altResponse.status, reason: `HTTP ${altResponse.status}` });
                  console.warn(`⚠️ Alternate URL ${alternateUrl} returned ${altResponse.status}`);
                }
              } catch (altError: any) {
                failedUrls.push({ url: alternateUrl, reason: altError.message || 'Network error' });
                console.warn(`⚠️ Alternate URL ${alternateUrl} failed:`, altError.message);
                continue;
              }
            }
            
            if (!success) {
              const failedDetails = failedUrls.slice(0, 5).map(f => `- ${f.url}: ${f.reason}${f.status ? ` (${f.status})` : ''}`).join('\n');
              const moreInfo = failedUrls.length > 5 ? `\n... and ${failedUrls.length - 5} more attempts` : '';
              
              throw new Error(
                `RSS feed not found. Tried ${alternateUrls.length} URLs including:\n${failedDetails}${moreInfo}\n\n` +
                `Possible reasons:\n` +
                `1. RSS feed URL may be incorrect - please verify the URL is correct\n` +
                `2. RSS feed may not be available on this website\n` +
                `3. Server may require authentication or special headers\n` +
                `4. RSS feed format may be non-standard and not supported\n\n` +
                `Please check the RSS feed URL or contact the website administrator.`
              );
            }
          } else if (!isXml && !isRss && !isAtom) {
            // Not XML, RSS, Atom, or HTML - probably error or wrong content
            throw new Error('Response is not a valid XML/RSS/Atom feed');
          } else {
            // It's XML/RSS/Atom, try parsing
            // Try parsing with rss-parser from string
            try {
              rssFeed = await parser.parseString(feedContent);
              console.log('✅ Successfully parsed feed from string');
            } catch (stringParseError: any) {
              console.warn('⚠️ String parse failed:', stringParseError.message);
              // Log first few lines for debugging
              console.log('📄 Feed content preview:', trimmedContent.substring(0, 1000));
              throw parseError; // Re-throw original error
            }
          }
        } else {
          throw parseError; // Re-throw if not a format recognition error
        }
      }
      
      if (!rssFeed || !rssFeed.items || rssFeed.items.length === 0) {
        throw new Error('RSS feed is empty or has no items');
      }
      
      console.log(`✅ Successfully parsed RSS feed: ${rssFeed.items.length} items found`);
    } catch (error: any) {
      console.error('❌ RSS fetch error:', error);
      
      // Provide more detailed error message
      let errorMessage = 'Failed to fetch RSS feed';
      
      if (error.message?.includes('not recognized as RSS 1 or 2') || 
          error.message?.includes('Feed not recognized')) {
        errorMessage = `Feed format not supported. The feed may be invalid or use an unsupported format. Please check the URL: ${feed.url}`;
      } else if (error.message?.includes('timeout')) {
        errorMessage = `Timeout while fetching RSS feed. Server may be too slow: ${feed.url}`;
      } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('getaddrinfo')) {
        errorMessage = `Cannot resolve hostname. Check if URL is correct: ${feed.url}`;
      } else if (error.message?.includes('404')) {
        errorMessage = `RSS feed not found (404). URL may be incorrect: ${feed.url}`;
      } else if (error.message?.includes('not a valid XML/RSS/Atom feed')) {
        errorMessage = `The URL does not return a valid RSS/Atom feed. It may return HTML or other content: ${feed.url}`;
      } else if (error.message) {
        errorMessage = `Failed to fetch RSS: ${error.message}`;
      }
      
      result.errors.push(errorMessage);
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
        let mainKeyword: string | null = null;
        
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
                    generateMetadata: true, // AI tạo title + description + main_keyword
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
                
                // Use AI-generated main keyword for autolink
                if (rewriteData.mainKeyword) {
                  mainKeyword = rewriteData.mainKeyword.toLowerCase().trim();
                  console.log(`🔗 Using AI-generated main keyword: ${mainKeyword}`);
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

        // Only one main image: prefer previously detected imageUrl or scraped main image
        let chosenImage: string | null = imageUrl || null;
        if (!chosenImage) {
          try {
            const scrapedImage = await extractMainImage(itemUrl);
            if (scrapedImage) {
              chosenImage = scrapedImage;
            }
          } catch {
            // ignore
          }
        }

        if (chosenImage) {
          const { caption, alt } = await generateImageCaptionAndAlt(title);
          const singleImageMarkdown = `\n\n![${alt}](${chosenImage})\n*${caption}*\n`;

          // Replace first placeholder if exists, else insert after first heading or first paragraph
          const placeholder = `[IMAGE_PLACEHOLDER_1]`;
          if (finalContent.includes(placeholder)) {
            finalContent = finalContent.replace(placeholder, singleImageMarkdown);
            console.log('✅ Inserted single image via placeholder');
          } else {
            const headingMatch = finalContent.match(/^##\s.+$/m);
            if (headingMatch && headingMatch.index !== undefined) {
              const insertPos = headingMatch.index + headingMatch[0].length;
              finalContent = finalContent.slice(0, insertPos) + singleImageMarkdown + finalContent.slice(insertPos);
              console.log('✅ Inserted single image after first heading');
            } else {
              const paragraphs = finalContent.split(/\n\n/);
              if (paragraphs.length > 0) {
                paragraphs[0] = paragraphs[0] + singleImageMarkdown;
                finalContent = paragraphs.join('\n\n');
                console.log('✅ Inserted single image after first paragraph');
              }
            }
          }
        } else {
          console.warn('⚠️ No main image available');
        }

        // Remove any remaining placeholders (if any)
        finalContent = finalContent.replace(/\[IMAGE_PLACEHOLDER_\d+\]/g, '');

        // Create article
        const { data: article, error: articleError } = await supabaseAdmin
          .from('articles')
          .insert({
            title,
            slug,
            description: finalDescription,
            content: finalContent,
            image_url: chosenImage,
            category: feed.category,
            author,
            published: false, // Set to false for manual review
            tags: aiTags.length > 0 ? aiTags : [],
            main_keyword: mainKeyword || null, // Main keyword for autolink feature
          })
          .select()
          .single();

        if (articleError) {
          result.errors.push(`Failed to create article "${title}": ${articleError.message}`);
          continue;
        }

        revalidateTargets.push({
          slug: article.slug,
          category: article.category,
          tags: Array.isArray(article.tags) ? article.tags : [],
        });

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
      const paths = [
        ...revalidateTargets
          .map((item) => (item.slug ? `/articles/${item.slug}` : undefined)),
        ...revalidateTargets
          .map((item) =>
            item.category ? `/category/${getCategorySlug(item.category)}` : undefined
          ),
        ...revalidateTargets.flatMap((item) =>
          Array.isArray(item.tags)
            ? item.tags.map((tag: string) => `/tag/${toSlug(tag)}`)
            : []
        ),
      ].filter((path): path is string => typeof path === 'string' && path.length > 0);

      await triggerRevalidate(paths, {
        logLabel: `rss-fetch-${feedId}`,
      });
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

