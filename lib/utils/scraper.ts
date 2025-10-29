import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';
import * as cheerio from 'cheerio';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  linkStyle: 'inlined',
  bulletListMarker: '-',
});

// Configure turndown to handle more cases
turndownService.addRule('strikethrough', {
  filter: ['del', 's'],
  replacement: (content) => `~~${content}~~`,
});

// Remove images with empty or invalid src
turndownService.addRule('removeInvalidImages', {
  filter: (node) => {
    if (node.nodeName === 'IMG') {
      const src = node.getAttribute('src');
      // Remove if src is empty, data URI, or too short
      if (!src || src.length < 5 || src.startsWith('data:') || src === '#') {
        return true;
      }
    }
    return false;
  },
  replacement: () => '', // Remove the image completely
});

// Better image handling with alt text and valid URLs
turndownService.addRule('images', {
  filter: 'img',
  replacement: (content, node: any) => {
    const alt = node.getAttribute('alt') || '';
    const src = node.getAttribute('src') || '';
    const title = node.getAttribute('title') || '';
    
    // Skip invalid images
    if (!src || src.length < 5 || src.startsWith('data:') || src === '#' || src.startsWith('//')) {
      return '';
    }
    
    // Build markdown
    const titlePart = title ? ` "${title}"` : '';
    return `\n\n![${alt}](${src}${titlePart})\n\n`;
  }
});

// Remove empty paragraphs and divs
turndownService.addRule('removeEmptyElements', {
  filter: (node) => {
    const tagName = node.nodeName.toLowerCase();
    if (['p', 'div', 'span'].includes(tagName)) {
      const text = node.textContent?.trim() || '';
      return text.length === 0;
    }
    return false;
  },
  replacement: () => '',
});

// Better table handling
turndownService.addRule('tables', {
  filter: 'table',
  replacement: (content, node: any) => {
    // For complex tables, just extract text content
    const text = node.textContent?.trim() || '';
    if (text.length > 0) {
      return `\n\n${text}\n\n`;
    }
    return '';
  }
});

// Custom selectors for Vietnamese news sites
const SITE_SELECTORS: { [key: string]: { content: string[], title?: string, remove?: string[] } } = {
  'vnexpress.net': {
    content: [
      'article.fck_detail',
      '.fck_detail',
      '.sidebar_1 .Normal',
      'article .Normal'
    ],
    title: 'h1.title-detail',
    remove: [
      '.box_comment',
      '.box-emotion',
      '.box-category-footer',
      '.box-share-top',
      '.width_common.the_new',
      '.ads-tag',
      '.box-tinlienquanv2'
    ]
  },
  'thanhnien.vn': {
    content: [
      '#main-detail .detail-cmain',
      '.detail-cmain',
      'article .pswp-content'
    ],
    title: 'h1.detail-title',
    remove: [
      '.details__tags',
      '.details__author',
      '.box-category-content',
      '.article-relate'
    ]
  },
  'tuoitre.vn': {
    content: [
      '#main-detail-content',
      '.detail-content',
      'article .content'
    ],
    title: 'h1.article-title',
    remove: [
      '.box-comm',
      '.box-category-link-detail',
      '.VCSortableInPreviewMode'
    ]
  },
  'zingnews.vn': {
    content: [
      '.the-article-body',
      'article .article-content',
      '.detail-content'
    ],
    title: 'h1.article-title',
    remove: [
      '.article-relate',
      '.box-category',
      '.box-comment'
    ]
  },
  'dantri.com.vn': {
    content: [
      '.singular-content',
      'article .e-magazine',
      '.detail-content'
    ],
    title: 'h1.title-page',
    remove: [
      '.dt-thumbnail-ads',
      '.box-category'
    ]
  }
};

export interface ScrapedArticle {
  title: string;
  content: string;
  excerpt: string;
  author?: string;
  publishedTime?: string;
  siteName?: string;
}

/**
 * Get domain from URL
 */
function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return '';
  }
}

/**
 * Clean Markdown content
 */
function cleanMarkdownContent(markdown: string): string {
  return markdown
    // Remove excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    // Remove citation numbers like [1], [2]
    .replace(/\[(\d+)\]/g, '')
    // Remove "Đọc thêm" links
    .replace(/\*\*Đọc thêm:.*?\*\*/gi, '')
    .replace(/Đọc thêm:.*?\n/gi, '')
    // Remove "Xem thêm" links
    .replace(/\*\*Xem thêm:.*?\*\*/gi, '')
    .replace(/Xem thêm:.*?\n/gi, '')
    // Remove "Theo" attribution lines
    .replace(/\*\*Theo.*?\*\*/gi, '')
    // Remove empty link texts
    .replace(/\[\]\(.*?\)/g, '')
    // Remove standalone parentheses
    .replace(/\(\s*\)/g, '')
    // Clean up spaces around images
    .replace(/!\[/g, '\n\n![')
    .replace(/\)\s*\n/g, ')\n\n')
    // Remove multiple spaces
    .replace(/ {2,}/g, ' ')
    // Clean up list formatting
    .replace(/\n-\s*\n/g, '\n')
    // Remove empty headers
    .replace(/^#+\s*$/gm, '')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Final cleanup
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Clean HTML before converting to Markdown
 */
function cleanHtml(html: string, baseUrl: string): string {
  const $ = cheerio.load(html);
  
  // Remove unwanted elements
  $(
    'script, style, iframe, noscript, ' +
    '.advertisement, .ads, .banner, ' +
    '[class*="ad-"], [id*="ad-"], ' +
    '.social-share, .share-buttons, ' +
    '.related-articles, .related-news, ' +
    '.comment, .comments, ' +
    'table[id*="adsense"]'
  ).remove();
  
  // Fix relative URLs in images
  $('img').each((_, elem) => {
    const $img = $(elem);
    let src = $img.attr('src');
    
    if (!src || src.length < 5 || src === '#' || src.startsWith('data:')) {
      // Remove invalid images
      $img.remove();
      return;
    }
    
    // Fix relative URLs
    if (src.startsWith('//')) {
      src = 'https:' + src;
    } else if (src.startsWith('/')) {
      try {
        const url = new URL(baseUrl);
        src = url.origin + src;
      } catch (e) {
        console.warn('Failed to fix relative URL:', src);
      }
    }
    
    $img.attr('src', src);
    
    // Ensure alt text exists
    if (!$img.attr('alt')) {
      $img.attr('alt', 'Image');
    }
  });
  
  // Fix relative URLs in links
  $('a').each((_, elem) => {
    const $link = $(elem);
    let href = $link.attr('href');
    
    if (href && href.startsWith('/') && !href.startsWith('//')) {
      try {
        const url = new URL(baseUrl);
        href = url.origin + href;
        $link.attr('href', href);
      } catch (e) {
        console.warn('Failed to fix relative URL:', href);
      }
    }
  });
  
  // Remove empty paragraphs
  $('p').each((_, elem) => {
    const $p = $(elem);
    if (!$p.text().trim()) {
      $p.remove();
    }
  });
  
  // Clean up figure/figcaption
  $('figure').each((_, elem) => {
    const $figure = $(elem);
    const $img = $figure.find('img').first();
    const $caption = $figure.find('figcaption').first();
    
    if ($img.length) {
      // Add caption as image title if exists
      if ($caption.length && $caption.text().trim()) {
        $img.attr('title', $caption.text().trim());
      }
      // Replace figure with just the img
      $figure.replaceWith($img);
    } else {
      $figure.remove();
    }
  });
  
  return $.html();
}

/**
 * Extract content using custom selectors for specific site
 */
function extractWithCustomSelectors(html: string, url: string): { title: string; content: string } | null {
  const domain = getDomain(url);
  const selectors = SITE_SELECTORS[domain];
  
  if (!selectors) {
    return null;
  }

  console.log(`📍 Using custom selectors for ${domain}`);
  
  const $ = cheerio.load(html);
  
  // Remove unwanted elements
  if (selectors.remove) {
    selectors.remove.forEach(selector => {
      $(selector).remove();
    });
  }
  
  // Remove common unwanted elements
  $('script, style, iframe, .advertisement, .ads, .banner, [class*="ad-"], [id*="ad-"]').remove();
  
  // Extract title
  let title = '';
  if (selectors.title) {
    title = $(selectors.title).first().text().trim();
  }
  if (!title) {
    title = $('h1').first().text().trim() || $('title').text().trim();
  }
  
  // Extract content - try each selector
  let contentHtml = '';
  for (const selector of selectors.content) {
    const element = $(selector);
    if (element.length > 0) {
      contentHtml = element.html() || '';
      if (contentHtml.length > 200) { // Minimum content length
        console.log(`✅ Found content with selector: ${selector} (${contentHtml.length} chars)`);
        break;
      }
    }
  }
  
  if (!contentHtml || contentHtml.length < 200) {
    console.warn(`⚠️ Custom selectors found insufficient content for ${domain}`);
    return null;
  }
  
  // Clean the HTML before returning
  const cleanedHtml = cleanHtml(contentHtml, url);
  
  return {
    title,
    content: cleanedHtml
  };
}

/**
 * Scrape full article content from URL using custom selectors + Readability fallback
 */
export async function scrapeFullArticle(url: string): Promise<ScrapedArticle | null> {
  try {
    console.log('🕷️ Scraping URL:', url);

    // Fetch the HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    if (!response.ok) {
      console.error('Failed to fetch URL:', response.status, response.statusText);
      return null;
    }

    const html = await response.text();
    
    // Method 1: Try custom selectors first (for Vietnamese news sites)
    const customExtract = extractWithCustomSelectors(html, url);
    
    if (customExtract && customExtract.content.length > 500) {
      console.log('✅ Using custom extractor (better accuracy)');
      
      // Convert HTML to Markdown
      const markdown = turndownService.turndown(customExtract.content);
      const cleanMarkdown = cleanMarkdownContent(markdown);
      
      return {
        title: customExtract.title,
        content: cleanMarkdown,
        excerpt: cleanMarkdown.substring(0, 500).trim(),
        siteName: getDomain(url),
      };
    }
    
    console.log('⚠️ Custom extractor failed, falling back to Readability...');

    // Method 2: Parse with JSDOM + Readability
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    // Use Readability to extract article
    const reader = new Readability(document, {
      charThreshold: 100, // Minimum content length
    });

    const article = reader.parse();

    if (!article) {
      console.error('❌ Readability also failed to parse article');
      return null;
    }

    // Convert HTML to Markdown
    const markdown = turndownService.turndown(article.content || '');

    // Clean up markdown
    const cleanMarkdown = cleanMarkdownContent(markdown);

    console.log('✅ Scraped successfully with Readability:', {
      title: article.title,
      contentLength: cleanMarkdown.length,
    });

    return {
      title: article.title || 'Untitled',
      content: cleanMarkdown,
      excerpt: article.excerpt || cleanMarkdown.substring(0, 500),
      author: article.byline || undefined,
      publishedTime: article.publishedTime || undefined,
      siteName: article.siteName || getDomain(url),
    };
  } catch (error: any) {
    console.error('❌ Error scraping article:', error.message);
    return null;
  }
}

/**
 * Extract image from article content or page
 */
export async function extractMainImage(url: string, htmlContent?: string): Promise<string | null> {
  try {
    if (!htmlContent) {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
        },
        signal: AbortSignal.timeout(10000),
      });
      htmlContent = await response.text();
    }

    const dom = new JSDOM(htmlContent, { url });
    const document = dom.window.document;

    // Try Open Graph image first
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage?.getAttribute('content')) {
      return ogImage.getAttribute('content');
    }

    // Try Twitter card image
    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage?.getAttribute('content')) {
      return twitterImage.getAttribute('content');
    }

    // Try article image
    const articleImage = document.querySelector('article img, .article-content img, .post-content img');
    if (articleImage?.getAttribute('src')) {
      const imgSrc = articleImage.getAttribute('src')!;
      // Convert relative URL to absolute
      return new URL(imgSrc, url).href;
    }

    // Try any large image
    const images = Array.from(document.querySelectorAll<HTMLImageElement>('img'));
    for (const img of images) {
      const src = img.getAttribute('src');
      const width = img.getAttribute('width');
      const height = img.getAttribute('height');
      
      if (src && (!width || parseInt(width) > 400) && (!height || parseInt(height) > 300)) {
        return new URL(src, url).href;
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting image:', error);
    return null;
  }
}

