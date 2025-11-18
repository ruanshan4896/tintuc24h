import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { scrapeFullArticle, extractMainImage } from '@/lib/utils/scraper';
import { getCategorySlug, toSlug } from '@/lib/utils/slug';
import { triggerRevalidate } from '@/lib/api/revalidate';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { uploadImageToSupabase, isSupabaseStorageUrl, uploadContentImages } from '@/lib/utils/image-upload';

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

// Round-robin index for caption generation keys
let currentCaptionKeyIndex = 0;
const exhaustedCaptionKeys = new Map<string, number>();
const CAPTION_EXHAUST_TTL_MS = 15 * 60 * 1000;
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

// Helper function to generate image caption and alt using AI
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
    let lastError;
    
    for (let attempt = 0; attempt < googleApiKeys.length; attempt++) {
      const keyIndex = (currentCaptionKeyIndex + attempt) % googleApiKeys.length;
      const selectedKey = googleApiKeys[keyIndex];
      const keyNumber = keyIndex + 1;
      
      if (isCaptionKeyExhausted(selectedKey)) {
        console.log(`⏭️ Skipping Caption Key #${keyNumber} (temporarily exhausted)`);
        continue;
      }

      try {
        const genAI = new GoogleGenerativeAI(selectedKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
        
        const result = await model.generateContent(prompt);
        response = result.response.text().trim();
        currentCaptionKeyIndex = (keyIndex + 1) % googleApiKeys.length;
        break;
      } catch (error: any) {
        const isQuotaError = error.message?.includes('429') || 
                             error.message?.includes('quota') ||
                             error.message?.includes('Too Many Requests');
        
        if (isQuotaError) {
          markCaptionKeyExhausted(selectedKey);
          lastError = error;
          await new Promise(r => setTimeout(r, 150));
          continue;
        } else {
          throw error;
        }
      }
    }
    
    if (!response) {
      if (lastError) {
        throw lastError;
      }
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
      const revalidatePathsExisting: string[] = [];
      if (article?.slug) {
        revalidatePathsExisting.push(`/articles/${article.slug}`);
      }
      if (article?.category) {
        revalidatePathsExisting.push(`/category/${getCategorySlug(article.category)}`);
      }
      if (Array.isArray(article?.tags)) {
        article.tags.forEach((tag: string) => {
          const slug = toSlug(tag);
          if (slug) {
            revalidatePathsExisting.push(`/tag/${slug}`);
          }
        });
      }

      await triggerRevalidate(revalidatePathsExisting, {
        logLabel: 'admin-import-existing',
      });

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
    let mainKeyword: string | null = null;
    
    console.log('🔍 Checking AI Rewrite conditions:');
    console.log('  - aiRewrite flag:', aiRewrite);
    console.log('  - content.length:', content.length);
    console.log('  - Should rewrite?', aiRewrite && content.length > 200);
    
    // Allow disabling AI rewrite globally via env
    const aiRewriteEnabled = process.env.AI_REWRITE_ENABLED !== 'false';
    if (aiRewrite && aiRewriteEnabled && content.length > 200) {
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

    // Only one main image: prefer previously detected imageUrl or scrape main
    let chosenImage: string | null = imageUrl || null;
    if (!chosenImage) {
      try {
        const scraped = await extractMainImage(url);
        if (scraped) chosenImage = scraped;
      } catch {
        // ignore
      }
    }

    // Upload image to Supabase Storage if it's from external source
    if (chosenImage && !isSupabaseStorageUrl(chosenImage)) {
      console.log('📤 Uploading image to Supabase Storage...');
      try {
        const supabaseImageUrl = await uploadImageToSupabase(
          chosenImage,
          slug,
          'featured',
          { format: 'avif', quality: 80 }
        );
        
        if (supabaseImageUrl) {
          console.log(`✅ Image uploaded successfully: ${supabaseImageUrl}`);
          chosenImage = supabaseImageUrl;
        } else {
          console.warn('⚠️ Image upload failed, using original URL');
        }
      } catch (uploadError: any) {
        console.error('❌ Image upload error:', uploadError.message);
        console.warn('⚠️ Using original image URL');
      }
    }

    if (chosenImage) {
      const { caption, alt } = await generateImageCaptionAndAlt(title);
      const singleImageMarkdown = `\n\n![${alt}](${chosenImage})\n*${caption}*\n`;
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

    // Upload all images in content to Supabase Storage
    console.log('🖼️  Processing images in content...');
    finalContent = await uploadContentImages(finalContent, slug);

    // Prepare article data - GIỐNG HỆT RSS FETCH
    const articleData = {
      title,
      slug,
      description: finalDescription, // Use AI-generated description if available
      content: finalContent, // Use AI-rewritten content if available
      image_url: chosenImage, // Use single main image
      category: category || 'Công nghệ',
      author: 'Ctrl Z', // Fixed author
      tags: aiTags.length > 0 ? aiTags : [], // Use AI-generated tags
      main_keyword: mainKeyword || null, // Main keyword for autolink feature
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
    const revalidatePathsNew: string[] = [];
    if (article?.slug) {
      revalidatePathsNew.push(`/articles/${article.slug}`);
    }
    if (article?.category) {
      revalidatePathsNew.push(`/category/${getCategorySlug(article.category)}`);
    }
    if (Array.isArray(article?.tags)) {
      article.tags.forEach((tag: string) => {
        const slug = toSlug(tag);
        if (slug) {
          revalidatePathsNew.push(`/tag/${slug}`);
        }
      });
    }

    await triggerRevalidate(revalidatePathsNew, {
      logLabel: 'admin-import-new',
    });

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

