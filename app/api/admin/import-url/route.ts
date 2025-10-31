import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { scrapeFullArticle, extractMainImage } from '@/lib/utils/scraper';
import { addKeywordLinks } from '@/lib/utils/keyword-linking';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Increase timeout for scraping + AI processing
export const maxDuration = 60; // seconds

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
    "&ldquo;": "\"",
    "&rdquo;": "\"",
  };

  let decoded = text;
  for (const entity in entities) {
    decoded = decoded.replace(new RegExp(entity, 'g'), entities[entity]);
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
  
  while (true) {
    const key = process.env[`GOOGLE_AI_API_KEY_${i}`];
    if (key) {
      keys.push(key);
      i++;
    } else {
      break;
    }
  }
  
  if (keys.length === 0 && process.env.GOOGLE_AI_API_KEY) {
    keys.push(process.env.GOOGLE_AI_API_KEY);
  }
  
  return keys;
}

// Helper function to generate image caption and alt using AI
async function generateImageCaptionAndAlt(
  articleTitle: string
): Promise<{ caption: string; alt: string }> {
  try {
    const googleApiKeys = getGoogleAIKeys();
    
    if (googleApiKeys.length === 0) {
      const mainTopic = articleTitle.split(':')[0].trim();
      return {
        caption: articleTitle.length > 60 ? articleTitle.substring(0, 60) + '...' : articleTitle,
        alt: mainTopic
      };
    }

    const prompt = `Tạo chú thích (caption) và mô tả thay thế (alt text) cho hình ảnh minh họa trong bài viết tin tức.

Tiêu đề bài viết: "${articleTitle}"

YÊU CẦU:
1. CAPTION (8-12 từ): Câu mô tả ngắn gọn, chuyên nghiệp về chủ đề bài viết
2. ALT (5-8 từ): Mô tả ngắn cho SEO/accessibility, chứa keywords chính

Format trả về (BẮT BUỘC):
CAPTION: [câu caption ở đây]
ALT: [mô tả alt ở đây]

Trả về NGAY theo format (KHÔNG giải thích):`;

    let response;
    
    for (let keyIndex = 0; keyIndex < googleApiKeys.length; keyIndex++) {
      const selectedKey = googleApiKeys[keyIndex];
      const keyNumber = keyIndex + 1;
      
      try {
        const genAI = new GoogleGenerativeAI(selectedKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
        
        const result = await model.generateContent(prompt);
        response = result.response.text().trim();
        break;
      } catch (error: any) {
        const isQuotaError = error.message?.includes('429') || 
                             error.message?.includes('quota') ||
                             error.message?.includes('Too Many Requests');
        
        if (isQuotaError) {
          continue;
        } else {
          throw error;
        }
      }
    }
    
    if (!response) {
      const mainTopic = articleTitle.split(':')[0].trim();
      return {
        caption: `Hình minh họa: ${mainTopic}`,
        alt: mainTopic
      };
    }
    
    const captionMatch = response.match(/CAPTION:\s*(.+)/i);
    const altMatch = response.match(/ALT:\s*(.+)/i);
    
    if (captionMatch && altMatch) {
      const caption = captionMatch[1].replace(/^["']|["']$/g, '').trim();
      const alt = altMatch[1].replace(/^["']|["']$/g, '').trim();
      return { caption, alt };
    } else {
      const mainTopic = articleTitle.split(':')[0].trim();
      return {
        caption: response.split('\n')[0].trim() || mainTopic,
        alt: mainTopic
      };
    }
  } catch (error: any) {
    const mainTopic = articleTitle.split(':')[0].trim();
    return {
      caption: `Hình minh họa: ${mainTopic}`,
      alt: mainTopic
    };
  }
}

// Helper function to generate slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

// POST - Import article from URL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, category, scrapeFullContent = true, aiRewrite = false, aiProvider = 'google', preview = true, article: existingArticle } = body;

    console.log('═══════════════════════════════════════════════');
    console.log('🔗 URL IMPORT STARTED');
    console.log('═══════════════════════════════════════════════');
    console.log('URL:', url);
    console.log('Category:', category);
    console.log('Scrape Full Content:', scrapeFullContent);
    console.log('AI Rewrite:', aiRewrite);
    console.log('AI Provider:', aiProvider);
    console.log('Preview Mode:', preview);

    if (!url) {
      return NextResponse.json(
        { success: false, errors: ['URL is required'] },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, errors: ['Invalid URL format'] },
        { status: 400 }
      );
    }

    // If existing article provided (from preview), just save it
    if (existingArticle && !preview) {
      console.log('💾 Saving existing article data...');
      
      const slug = existingArticle.slug || generateSlug(existingArticle.title);
      
      // Check if slug already exists
      const { data: existing } = await supabaseAdmin
        .from('articles')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existing) {
        return NextResponse.json(
          { success: false, errors: [`Slug "${slug}" already exists. Please edit the title.`] },
          { status: 400 }
        );
      }

      const { data: article, error: articleError } = await supabaseAdmin
        .from('articles')
        .insert({
          title: existingArticle.title,
          slug,
          description: existingArticle.description,
          content: existingArticle.content,
          image_url: existingArticle.image_url,
          category: existingArticle.category,
          author: existingArticle.author || 'Ctrl Z',
          published: false, // Set to false for manual review
          tags: existingArticle.tags || [],
        })
        .select()
        .single();

      if (articleError) {
        return NextResponse.json(
          { success: false, errors: [`Failed to create article: ${articleError.message}`] },
          { status: 500 }
        );
      }

      // Revalidate sitemap
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        await fetch(`${baseUrl}/api/admin/revalidate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: '/post-sitemap.xml' }),
        });
        console.log('✅ Sitemap revalidated');
      } catch (revalError) {
        console.warn('⚠️ Could not revalidate sitemap:', revalError);
      }

      return NextResponse.json({
        success: true,
        message: 'Article created successfully',
        article,
      });
    }

    // Scrape article from URL
    console.log('🔍 Scraping article from URL...');
    
    let scrapedData;
    try {
      scrapedData = await scrapeFullArticle(url, scrapeFullContent);
    } catch (error: any) {
      console.error('❌ Scraping error:', error);
      return NextResponse.json(
        { success: false, errors: [`Failed to scrape URL: ${error.message}`] },
        { status: 500 }
      );
    }

    if (!scrapedData || !scrapedData.title || !scrapedData.content) {
      return NextResponse.json(
        { success: false, errors: ['Could not extract title or content from URL'] },
        { status: 400 }
      );
    }

    let title = decodeHtmlEntities(scrapedData.title);
    let content = scrapedData.content;
    const imageUrl = scrapedData.imageUrl || await extractMainImage(url);

    console.log(`✅ Scraped: "${title.substring(0, 50)}..." (${content.length} chars)`);

    // Generate description from content if not provided
    let description = scrapedData.description || content.substring(0, 160).replace(/\n/g, ' ').trim() + '...';
    if (description.length > 200) {
      description = description.substring(0, 197) + '...';
    }

    // AI Rewrite if enabled
    let aiTags: string[] = [];
    if (aiRewrite && content.length > 200) {
      console.log('🤖 Starting AI rewrite...');
      
      try {
        const rewriteRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/ai-rewrite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            title,
            tone: 'professional',
            provider: aiProvider,
            generateMetadata: true, // Generate SEO title, desc, tags
          }),
        });

        if (rewriteRes.ok) {
          const rewriteData = await rewriteRes.json();
          
          if (rewriteData.content) {
            content = rewriteData.content;
            console.log(`✅ AI Rewrite completed (${content.length} chars)`);
            
            // Extract metadata if provided
            if (rewriteData.seoTitle) {
              title = rewriteData.seoTitle;
            }
            if (rewriteData.seoDescription) {
              description = rewriteData.seoDescription;
            }
            if (rewriteData.tags && Array.isArray(rewriteData.tags)) {
              aiTags = rewriteData.tags;
            }
          }
        } else {
          console.warn('⚠️ AI Rewrite failed, using original content');
        }
      } catch (error: any) {
        console.warn('⚠️ AI Rewrite error:', error.message);
      }
    }

    // Generate slug
    const slug = generateSlug(title);

    // Check if slug already exists (only if saving)
    if (!preview) {
      const { data: existing } = await supabaseAdmin
        .from('articles')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existing) {
        return NextResponse.json(
          { success: false, errors: [`Slug "${slug}" already exists. Please edit the title.`] },
          { status: 400 }
        );
      }
    }

    // Process image if available
    let finalContent = content;
    if (imageUrl) {
      console.log(`🖼️ Using scraped image: ${imageUrl}`);
      
      const { caption, alt } = await generateImageCaptionAndAlt(title);
      
      // Replace IMAGE_PLACEHOLDER_1 if exists, or insert after first heading
      if (finalContent.includes('[IMAGE_PLACEHOLDER_1]')) {
        const imageMarkdown = `\n\n![${alt}](${imageUrl})\n*${caption}*\n`;
        finalContent = finalContent.replace('[IMAGE_PLACEHOLDER_1]', imageMarkdown);
      } else {
        // Insert after first heading
        const firstHeadingMatch = finalContent.match(/^##\s.+$/m);
        if (firstHeadingMatch) {
          const headingIndex = firstHeadingMatch.index! + firstHeadingMatch[0].length;
          const imageMarkdown = `\n\n![${alt}](${imageUrl})\n*${caption}*\n\n`;
          finalContent = finalContent.slice(0, headingIndex) + imageMarkdown + finalContent.slice(headingIndex);
        }
      }
      
      // Remove any remaining placeholders
      finalContent = finalContent.replace(/\[IMAGE_PLACEHOLDER_\d+\]/g, '');
    }

    // Add keyword links
    const tempArticleId = 'temp-' + Date.now();
    finalContent = await addKeywordLinks(finalContent, title, tempArticleId, aiTags);

    // Prepare article data
    const articleData = {
      title,
      slug,
      description,
      content: finalContent,
      image_url: imageUrl,
      category: category || 'Công nghệ',
      author: 'Ctrl Z',
      tags: aiTags.length > 0 ? aiTags : [],
    };

    // If preview mode, return article data without saving
    if (preview) {
      return NextResponse.json({
        success: true,
        article: articleData,
      });
    }

    // Save to database
    const { data: article, error: articleError } = await supabaseAdmin
      .from('articles')
      .insert({
        ...articleData,
        published: false, // Set to false for manual review
      })
      .select()
      .single();

    if (articleError) {
      return NextResponse.json(
        { success: false, errors: [`Failed to create article: ${articleError.message}`] },
        { status: 500 }
      );
    }

    // Revalidate sitemap
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      await fetch(`${baseUrl}/api/admin/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/post-sitemap.xml' }),
      });
      console.log('✅ Sitemap revalidated');
    } catch (revalError) {
      console.warn('⚠️ Could not revalidate sitemap:', revalError);
    }

    return NextResponse.json({
      success: true,
      message: 'Article imported successfully',
      article,
    });

  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERROR IMPORTING URL');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error Type:', error.constructor?.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return NextResponse.json(
      { success: false, errors: [`Internal server error: ${error.message}`] },
      { status: 500 }
    );
  }
}

