import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { scrapeFullArticle, extractMainImage, extractArticleImages } from '@/lib/utils/scraper';
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

    // Scrape article from URL - GIỐNG HỆT RSS FETCH
    console.log('🔍 Scraping article from URL...');
    
    let scrapedData;
    try {
      scrapedData = await scrapeFullArticle(url);
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
    
    // Try to get image from scraping, fallback to extractMainImage
    let imageUrl: string | null = null;
    try {
      imageUrl = await extractMainImage(url);
    } catch (error: any) {
      console.warn('⚠️ Could not extract image:', error.message);
    }

    console.log(`✅ Scraped: "${title.substring(0, 50)}..." (${content.length} chars)`);

    // Generate description from excerpt or content (sẽ được override bởi AI nếu có)
    let description = scrapedData.excerpt || content.substring(0, 160).replace(/\n/g, ' ').trim() + '...';
    if (description.length > 200) {
      description = description.substring(0, 197) + '...';
    }

    // AI Rewrite if enabled - GIỐNG HỆT RSS FETCH
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
            generateMetadata: true, // AI tạo title + description + tags
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

    // Extract multiple images (2-3 images) from article - GIỐNG HỆT RSS FETCH
    let articleImages: string[] = [];
    try {
      articleImages = await extractArticleImages(url, undefined, 3);
      console.log(`🖼️ Extracted ${articleImages.length} images from article`);
    } catch (error: any) {
      console.warn('⚠️ Failed to extract multiple images, using main image:', error.message);
      // Fallback to single image
      if (imageUrl) {
        articleImages = [imageUrl];
      }
    }

    // Use scraped images if available (NO Unsplash!) - GIỐNG HỆT RSS FETCH
    if (articleImages.length > 0) {
      console.log(`🖼️ Processing ${articleImages.length} images...`);
      
      // Process each image with AI-generated caption & alt
      const imageMarkdowns: string[] = [];
      for (let i = 0; i < articleImages.length; i++) {
        const imgUrl = articleImages[i];
        const { caption, alt } = await generateImageCaptionAndAlt(title);
        imageMarkdowns.push(`\n\n![${alt}](${imgUrl})\n*${caption}*\n`);
      }

      // Replace placeholders or insert images
      let placeholderCount = 0;
      for (let i = 0; i < imageMarkdowns.length; i++) {
        const placeholder = `[IMAGE_PLACEHOLDER_${i + 1}]`;
        if (finalContent.includes(placeholder)) {
          finalContent = finalContent.replace(placeholder, imageMarkdowns[i]);
          placeholderCount++;
          console.log(`✅ Replaced ${placeholder} with image ${i + 1}`);
        }
      }

      // If no placeholders, insert images after headings
      if (placeholderCount === 0 && imageMarkdowns.length > 0) {
        // Insert first image after first heading
        const firstHeadingMatch = finalContent.match(/^##\s.+$/m);
        if (firstHeadingMatch) {
          const insertPosition = firstHeadingMatch.index! + firstHeadingMatch[0].length;
          finalContent = finalContent.slice(0, insertPosition) + imageMarkdowns[0] + finalContent.slice(insertPosition);
          console.log(`✅ Inserted first image after first heading`);
        }

        // Insert remaining images after subsequent headings (if available)
        if (imageMarkdowns.length > 1) {
          const headingMatches = Array.from(finalContent.matchAll(/^##\s.+$/gm));
          for (let i = 1; i < imageMarkdowns.length && i < headingMatches.length; i++) {
            const headingMatch = headingMatches[i];
            const insertPosition = headingMatch.index! + headingMatch[0].length;
            finalContent = finalContent.slice(0, insertPosition) + imageMarkdowns[i] + finalContent.slice(insertPosition);
            console.log(`✅ Inserted image ${i + 1} after heading ${i + 1}`);
          }
        }
      }
    } else {
      console.warn('⚠️ No images available from scraping');
    }

    // Remove any remaining placeholders (if any)
    finalContent = finalContent.replace(/\[IMAGE_PLACEHOLDER_\d+\]/g, '');

    // Auto Keyword Linking: Add internal links to related articles - GIỐNG HỆT RSS FETCH
    console.log('🔗 Adding keyword links...');
    // Generate temporary ID for new article (use slug as identifier)
    const tempArticleId = 'temp-' + Date.now();
    
    // Add keyword links to content (use AI-generated tags as keywords)
    finalContent = await addKeywordLinks(finalContent, title, tempArticleId, aiTags);

    // Prepare article data - GIỐNG HỆT RSS FETCH
    const articleData = {
      title,
      slug,
      description: finalDescription, // Use AI-generated description if available
      content: finalContent, // Use AI-rewritten content if available
      image_url: articleImages.length > 0 ? articleImages[0] : null, // Use first image as main image
      category: category || 'Công nghệ',
      author: 'Ctrl Z', // Fixed author
      tags: aiTags.length > 0 ? aiTags : [], // Use AI-generated tags
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

