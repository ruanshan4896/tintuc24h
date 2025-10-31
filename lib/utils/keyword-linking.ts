/**
 * Auto Keyword Linking Utility
 * Automatically add internal links to keywords in article content
 */

import { supabaseAdmin } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface KeywordMatch {
  keyword: string;
  slug: string;
  title: string;
}

/**
 * Extract important keywords/phrases from article title and content
 * Uses n-grams (bigrams, trigrams) to capture multi-word phrases
 * @param title - Article title
 * @param content - Article markdown content
 * @returns Array of potential keywords (lowercase, sorted by priority)
 */
function extractKeywords(title: string, content: string): string[] {
  // Common Vietnamese stop words to ignore
  const stopWords = new Set([
    'của', 'và', 'là', 'có', 'để', 'được', 'trong', 'tại', 'với', 'cho',
    'từ', 'về', 'theo', 'đã', 'sẽ', 'thì', 'này', 'đó', 'hay', 'hoặc',
    'như', 'khi', 'nếu', 'vì', 'bởi', 'cùng', 'nhưng', 'mà', 'bằng', 'không',
    'các', 'những', 'một', 'vào', 'ra', 'đến', 'lên', 'xuống', 'bị', 'làm',
    'năm', 'ngày', 'tháng', 'giờ', 'phút', 'giây', 'tuần', 'thời', 'gian',
    'cho', 'người', 'việc', 'cách', 'nào', 'sau', 'trước', 'giữa', 'ngoài',
  ]);

  const allKeywords: string[] = [];

  /**
   * Extract n-grams from text (bigrams, trigrams, 4-grams)
   */
  function extractNGrams(text: string): string[] {
    const cleanText = text
      .toLowerCase()
      .replace(/[?!.,;:'"()[\]{}]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const words = cleanText.split(' ').filter(w => w.length > 0);
    const ngrams: string[] = [];

    // Trigrams (3 words) - highest priority
    for (let i = 0; i <= words.length - 3; i++) {
      const trigram = words.slice(i, i + 3).join(' ');
      // Skip if contains stop words only
      if (!words.slice(i, i + 3).every(w => stopWords.has(w))) {
        ngrams.push(trigram);
      }
    }

    // Bigrams (2 words) - medium priority
    for (let i = 0; i <= words.length - 2; i++) {
      const bigram = words.slice(i, i + 2).join(' ');
      // Skip if contains stop words only
      if (!words.slice(i, i + 2).every(w => stopWords.has(w))) {
        ngrams.push(bigram);
      }
    }

    // Single words (unigrams) - lowest priority, only if meaningful
    for (const word of words) {
      if (word.length > 4 && !stopWords.has(word)) {
        ngrams.push(word);
      }
    }

    return ngrams;
  }

  // Extract from title (highest priority)
  const titleNGrams = extractNGrams(title);
  allKeywords.push(...titleNGrams);

  // Extract from headings in content (## or ###)
  const headingMatches = content.match(/^#{2,3}\s+(.+)$/gm) || [];
  for (const heading of headingMatches) {
    const headingText = heading.replace(/^#{2,3}\s+/, '');
    const headingNGrams = extractNGrams(headingText);
    allKeywords.push(...headingNGrams);
  }

  // Deduplicate and prioritize:
  // 1. Longer phrases first (more specific)
  // 2. Phrases from title
  const uniqueKeywords = [...new Set(allKeywords)];
  const sortedKeywords = uniqueKeywords.sort((a, b) => {
    // Prioritize longer phrases
    const wordCountDiff = b.split(' ').length - a.split(' ').length;
    if (wordCountDiff !== 0) return wordCountDiff;
    
    // Then prioritize title keywords
    const aInTitle = titleNGrams.includes(a) ? 1 : 0;
    const bInTitle = titleNGrams.includes(b) ? 1 : 0;
    return bInTitle - aInTitle;
  });

  // Return top 15 keywords (more than before, but better quality)
  const topKeywords = sortedKeywords.slice(0, 15);
  
  console.log('📝 Extracted n-grams (bigrams/trigrams):');
  console.log('  - Trigrams (3 words):', topKeywords.filter(k => k.split(' ').length === 3).slice(0, 3));
  console.log('  - Bigrams (2 words):', topKeywords.filter(k => k.split(' ').length === 2).slice(0, 5));
  console.log('  - Unigrams (1 word):', topKeywords.filter(k => k.split(' ').length === 1).slice(0, 3));
  
  return topKeywords;
}

/**
 * Find articles that match keywords
 * @param keywords - Array of keywords to search for
 * @param currentArticleId - ID of current article (to exclude)
 * @returns Array of keyword matches with article slug and title
 */
async function findMatchingArticles(
  keywords: string[],
  currentArticleId: string
): Promise<KeywordMatch[]> {
  const matches: KeywordMatch[] = [];

  try {
    // Build query (using supabaseAdmin for server-side)
    let query = supabaseAdmin
      .from('articles')
      .select('id, title, slug')
      .eq('published', true)
      .limit(50); // Get recent articles

    // Only exclude current article if it's a valid UUID (not a temp ID)
    if (currentArticleId && !currentArticleId.startsWith('temp-')) {
      query = query.neq('id', currentArticleId);
    }

    const { data: articles, error } = await query;

    if (error) {
      console.error('Error finding matching articles:', error);
      return [];
    }

    if (!articles) return [];

    // Match keywords against article titles
    // Prioritize longer phrases first (more specific matches)
    for (const keyword of keywords) {
      for (const article of articles) {
        const titleLower = article.title.toLowerCase();
        
        // Check if keyword appears in title (exact match or partial)
        if (titleLower.includes(keyword)) {
          // Skip if already matched
          if (matches.find(m => m.slug === article.slug)) continue;
          
          matches.push({
            keyword,
            slug: article.slug,
            title: article.title,
          });

          console.log(`  ✅ Match: "${keyword}" → "${article.title}"`);

          // Limit to 5 matches total
          if (matches.length >= 5) break;
        }
      }
      if (matches.length >= 5) break;
    }

    return matches;
  } catch (error) {
    console.error('Error in findMatchingArticles:', error);
    return [];
  }
}

/**
 * Add internal links to content based on keyword matches
 * @param content - Original markdown content
 * @param matches - Array of keyword matches
 * @returns Modified content with internal links
 */
function addLinksToContent(content: string, matches: KeywordMatch[]): string {
  if (matches.length === 0) return content;

  // Split content into lines to avoid linking in headings
  const lines = content.split('\n');
  const linkedKeywords = new Set<string>(); // Track already linked keywords

  // Sort matches by keyword length (longest first) to avoid partial replacements
  const sortedMatches = [...matches].sort((a, b) => b.keyword.length - a.keyword.length);

  for (const match of sortedMatches) {
    // Skip if this keyword has already been linked
    if (linkedKeywords.has(match.keyword)) continue;

    // SKIP invalid keywords
    const keyword = match.keyword.trim();
    
    // 1. Skip pure numbers (e.g., "2026", "100", "5")
    if (/^\d+$/.test(keyword)) {
      console.log(`⏭️ Skipping pure number keyword: "${keyword}"`);
      continue;
    }
    
    // 2. Skip keywords too short (< 3 characters)
    if (keyword.length < 3) {
      console.log(`⏭️ Skipping too short keyword: "${keyword}"`);
      continue;
    }
    
    // 3. Skip common stop words (Vietnamese & English)
    const stopWords = [
      'của', 'và', 'là', 'có', 'để', 'được', 'trong', 'tại', 'với', 'cho',
      'từ', 'về', 'theo', 'đã', 'sẽ', 'thì', 'này', 'đó', 'hay', 'hoặc',
      'the', 'and', 'for', 'with', 'new', 'all', 'more'
    ];
    if (stopWords.includes(keyword.toLowerCase())) {
      console.log(`⏭️ Skipping stop word: "${keyword}"`);
      continue;
    }

    // Create regex to find keyword (case-insensitive, not already in link)
    // Avoid matching inside existing links or code blocks
    const keywordRegex = new RegExp(
      `(?<!\\[)\\b(${escapeRegex(keyword)})\\b(?![^\\[]*\\]\\([^)]*\\))(?!\`[^\`]*\`)`,
      'i'
    );

    // Process each line
    let foundAndReplaced = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // SKIP headings (lines starting with #)
      if (line.trim().startsWith('#')) continue;
      
      // SKIP code blocks (lines starting with ```)
      if (line.trim().startsWith('```')) continue;
      
      // SKIP lines that are already links
      if (line.includes('](/articles/')) continue;
      
      // Try to replace keyword in this line
      if (keywordRegex.test(line)) {
        // NO title attribute - simpler and avoids all quote issues
        lines[i] = line.replace(
          keywordRegex,
          `[$1](/articles/${match.slug})`
        );
        
        linkedKeywords.add(keyword);
        foundAndReplaced = true;
        break; // Only link once per keyword
      }
    }

    // Stop after 3-5 links to avoid over-optimization
    if (linkedKeywords.size >= 3) break;
  }

  return lines.join('\n');
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Simple function to get main keyword for self-link
 */
function getMainKeyword(title: string, tags: string[]): string {
  if (tags && tags.length > 0) {
    // Use first tag that's meaningful
    const meaningfulTags = tags.filter(t => t.length > 3 && !/^\d+$/.test(t));
    return meaningfulTags[0] || tags[0];
  }
  
  // Extract from title: get first 2-3 meaningful words
  const words = title.split(/[\s:—-]+/).filter(w => w.length > 3);
  return words.slice(0, 2).join(' ') || title.split(' ').slice(0, 2).join(' ');
}

/**
 * DEPRECATED: Generate anchor texts and home author sentence using AI for fixed links
 * This function is no longer used - we use simple sentence appending instead
 * Keeping for reference only
 */
async function generateAnchorTexts_DEPRECATED(
  title: string,
  category: string,
  mainKeyword: string,
  content: string
): Promise<{ homeAuthorSentence: string; categorySentence: string; selfAnchor: string }> {
  try {
    // Get Google AI keys
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

    const googleApiKeys = getGoogleAIKeys();
    if (googleApiKeys.length === 0) {
      // Fallback
      const categorySlug = categoryToSlug(category);
      return {
        homeAuthorSentence: '[Bài viết được thực hiện bởi trang tin tức Ctrl Z.](/)',
        categorySentence: `[Tin tức ${category.toLowerCase()} của chúng tôi cập nhật thường xuyên.](/category/${categorySlug})`,
        selfAnchor: mainKeyword || title.split(' ').slice(0, 3).join(' ')
      };
    }

    // Get snippets of content for context (beginning, middle, end)
    const contentLines = content.split('\n').filter(line => line.trim().length > 30);
    const beginningSnippet = content.substring(0, 400);
    const middleSnippet = contentLines.length > 5 
      ? contentLines.slice(Math.floor(contentLines.length / 2), Math.floor(contentLines.length / 2) + 2).join('\n')
      : '';
    const endSnippet = contentLines.length > 3
      ? contentLines.slice(-2).join('\n')
      : '';

    const prompt = `Phân tích nội dung bài viết và tạo nội dung cho 3 liên kết.

Tiêu đề bài viết: "${title}"
Danh mục: "${category}"
Từ khóa chính: "${mainKeyword}"

Đoạn đầu bài viết:
"${beginningSnippet}"

${middleSnippet ? `Đoạn giữa bài viết:\n"${middleSnippet}"\n` : ''}

${endSnippet ? `Đoạn cuối bài viết:\n"${endSnippet}"\n` : ''}

YÊU CẦU:
1. HOME_AUTHOR_SENTENCE: Một câu tự nhiên (8-15 từ) nhắc đến "trang tin tức Ctrl Z" hoặc "Ctrl Z" như nguồn tin/tác giả. Câu phải PHÙ HỢP VỚI NGỮ CẢNH và có thể chèn tự nhiên vào bất kỳ đâu trong bài viết, không phải chỉ ở cuối. Ví dụ: "Theo trang tin tức Ctrl Z, thông tin trên được cập nhật mới nhất.", "Nguồn tin từ trang tin tức Ctrl Z cho biết...", "Trang tin tức Ctrl Z ghi nhận..."
2. CATEGORY_SENTENCE: Một câu tự nhiên (8-15 từ) nhắc đến danh mục "${category}" một cách tự nhiên trong ngữ cảnh bài viết. Câu phải PHÙ HỢP VỚI NGỮ CẢNH và có thể chèn vào bất kỳ đâu trong bài viết. Ví dụ: "Đây là một trong những tin tức mới nhất trong mục ${category}.", "Tin tức ${category} đang thu hút sự quan tâm...", "Chuyên mục ${category} của chúng tôi đã cập nhật..."
3. SELF_ANCHOR (1-3 từ): Anchor text cho link về chính bài viết này

Format trả về (BẮT BUỘC):
HOME_AUTHOR_SENTENCE: [câu tự nhiên nhắc đến Ctrl Z, có thể chèn bất kỳ đâu trong bài]
CATEGORY_SENTENCE: [câu tự nhiên nhắc đến danh mục ${category}, có thể chèn bất kỳ đâu trong bài]
SELF_ANCHOR: [anchor text cho bài viết]

VÍ DỤ:
Input: "iPhone 15 Ra Mắt", "Công nghệ", "iPhone 15"
HOME_AUTHOR_SENTENCE: Theo trang tin tức Ctrl Z, thông tin trên được xác nhận.
CATEGORY_SENTENCE: Tin tức công nghệ mới nhất cho thấy xu hướng này đang phát triển.
SELF_ANCHOR: iPhone 15

Input: "VinFast VF 7", "Ô tô", "VinFast"
HOME_AUTHOR_SENTENCE: Nguồn tin từ trang tin tức Ctrl Z cho biết thông tin chi tiết.
CATEGORY_SENTENCE: Chuyên mục ô tô của chúng tôi đã cập nhật nhiều thông tin hữu ích.
SELF_ANCHOR: VinFast

LƯU Ý:
- HOME_AUTHOR_SENTENCE phải TỰ NHIÊN, có thể chèn vào giữa bài, không chỉ ở cuối. Phải chứa "Ctrl Z" hoặc "trang tin tức Ctrl Z".
- CATEGORY_SENTENCE phải TỰ NHIÊN, nhắc đến "${category}" một cách tự nhiên, có thể chèn vào giữa bài. Phải chứa tên danh mục "${category}".

Trả về NGAY theo format (KHÔNG giải thích):`;

    let response;
    let lastError;
    
    for (let keyIndex = 0; keyIndex < googleApiKeys.length; keyIndex++) {
      const selectedKey = googleApiKeys[keyIndex];
      const keyNumber = keyIndex + 1;
      
      try {
        console.log(`🔑 Generating anchor texts with Key #${keyNumber}...`);
        
        const genAI = new GoogleGenerativeAI(selectedKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
        
        const result = await model.generateContent(prompt);
        response = result.response.text().trim();
        
        console.log(`✅ Success with Key #${keyNumber}`);
        break;
        
      } catch (error: any) {
        const isQuotaError = error.message?.includes('429') || 
                             error.message?.includes('quota') ||
                             error.message?.includes('Too Many Requests');
        
        if (isQuotaError) {
          console.log(`⚠️ Key #${keyNumber} quota exceeded, trying next key...`);
          lastError = error;
          continue;
        } else {
          throw error;
        }
      }
    }
    
    if (!response) {
      throw lastError || new Error('All Google AI keys quota exceeded');
    }

    // Parse response
    const homeSentenceMatch = response.match(/HOME_AUTHOR_SENTENCE:\s*(.+)/i);
    const categorySentenceMatch = response.match(/CATEGORY_SENTENCE:\s*(.+)/i);
    const selfMatch = response.match(/SELF_ANCHOR:\s*(.+)/i);

    if (homeSentenceMatch && categorySentenceMatch && selfMatch) {
      let homeSentence = homeSentenceMatch[1].replace(/^["']|["']$/g, '').trim();
      let categorySentence = categorySentenceMatch[1].replace(/^["']|["']$/g, '').trim();
      
      // Ensure home sentence contains "Ctrl Z" or "trang tin tức Ctrl Z"
      if (!homeSentence.includes('Ctrl Z') && !homeSentence.includes('ctrl z')) {
        homeSentence = homeSentence.replace(/trang tin tức/i, 'trang tin tức Ctrl Z');
      }
      
      // Create link in home sentence (replace "Ctrl Z" or "trang tin tức Ctrl Z" with link)
      const homeLinkPattern = /(trang tin tức Ctrl Z|Ctrl Z)/i;
      if (homeLinkPattern.test(homeSentence)) {
        homeSentence = homeSentence.replace(
          homeLinkPattern,
          (match) => `[${match}](/)`
        );
      } else {
        // Fallback: insert link before sentence
        homeSentence = `[${homeSentence}](/)`;
      }
      
      // Ensure category sentence contains category name
      const categoryLower = category.toLowerCase();
      if (!categorySentence.toLowerCase().includes(categoryLower)) {
        // Try to add category name naturally
        categorySentence = categorySentence.replace(
          /(tin tức|chuyên mục|mục|danh mục)/i,
          `$1 ${category.toLowerCase()}`
        );
      }
      
      // Create link in category sentence (replace category name with link)
      const categorySlug = categoryToSlug(category);
      const categoryLinkPattern = new RegExp(`\\b(${category}|tin ${categoryLower}|tin tức ${categoryLower}|chuyên mục ${categoryLower})\\b`, 'i');
      if (categoryLinkPattern.test(categorySentence)) {
        categorySentence = categorySentence.replace(
          categoryLinkPattern,
          (match) => `[${match}](/category/${categorySlug})`
        );
      } else {
        // Fallback: insert link before sentence
        categorySentence = `[${categorySentence}](/category/${categorySlug})`;
      }
      
      return {
        homeAuthorSentence: homeSentence,
        categorySentence: categorySentence,
        selfAnchor: selfMatch[1].replace(/^["']|["']$/g, '').trim()
      };
    }

    // Fallback
    const categorySlug = categoryToSlug(category);
    return {
      homeAuthorSentence: '[Bài viết được thực hiện bởi trang tin tức Ctrl Z.](/)',
      categorySentence: `[Tin tức ${category.toLowerCase()} của chúng tôi cập nhật thường xuyên.](/category/${categorySlug})`,
      selfAnchor: mainKeyword || title.split(' ').slice(0, 3).join(' ')
    };

  } catch (error: any) {
    console.error('❌ Error generating anchor texts:', error.message);
    // Fallback
    const categorySlug = categoryToSlug(category);
    return {
      homeAuthorSentence: '[Bài viết được thực hiện bởi trang tin tức Ctrl Z.](/)',
      categorySentence: `[Tin tức ${category.toLowerCase()} của chúng tôi cập nhật thường xuyên.](/category/${categorySlug})`,
      selfAnchor: mainKeyword || title.split(' ').slice(0, 3).join(' ')
    };
  }
}

/**
 * Convert category name to slug
 */
function categoryToSlug(category: string): string {
  const categoryMap: { [key: string]: string } = {
    'Công nghệ': 'cong-nghe',
    'Thể thao': 'the-thao',
    'Sức khỏe': 'suc-khoe',
    'Ô tô': 'o-to',
    'Giải trí': 'giai-tri',
    'Game': 'game',
  };
  return categoryMap[category] || category.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Add fixed links to content naturally
 * Strategy: Insert as separate paragraphs in natural positions
 */
function addFixedLinks(
  content: string,
  category: string,
  categorySlug: string,
  selfAnchor: string,
  articleSlug: string
): string {
  const lines = content.split('\n');
  let homeAdded = false;
  let categoryAdded = false;
  let selfAdded = false;

  // Helper: Check if line is a valid paragraph (not heading, code, image, or link)
  const isValidParagraph = (line: string, minLength = 30): boolean => {
    const trimmed = line.trim();
    return trimmed.length >= minLength &&
           !trimmed.startsWith('#') &&
           !trimmed.startsWith('```') &&
           !trimmed.startsWith('![') &&
           !trimmed.startsWith('*') && // Skip image captions
           !trimmed.includes('](/articles/') &&
           !trimmed.includes('](/category/') &&
           !trimmed.includes('](/');
  };

  // Diverse sentence templates for natural variety
  const homeParagraphs = [
    `Theo [trang tin tức Ctrl Z](/), thông tin trên được cập nhật mới nhất.`,
    `[Trang tin tức Ctrl Z](/) đã ghi nhận và cập nhật thông tin này.`,
    `Nguồn tin từ [trang tin tức Ctrl Z](/) cho biết thông tin chi tiết.`,
    `Thông tin được [trang tin tức Ctrl Z](/) xác nhận và công bố.`,
    `[Ctrl Z](/), trang tin tức đáng tin cậy, đã cập nhật thông tin trên.`,
    `Theo nguồn tin từ [Ctrl Z](/), đây là thông tin mới nhất.`,
    `[Trang tin tức Ctrl Z](/) đã tổng hợp và phân tích thông tin này.`,
    `Thông tin do [Ctrl Z](/) thu thập và xác minh.`,
  ];

  // Category-specific paragraph templates for better variety
  const getCategoryParagraphs = (categoryName: string, slug: string): string[] => {
    const baseParagraphs = [
      `Tin tức [${categoryName}](/category/${slug}) đang thu hút sự quan tâm của độc giả.`,
      `Chuyên mục [${categoryName}](/category/${slug}) của chúng tôi cập nhật thường xuyên.`,
      `Đây là một trong những tin tức mới nhất trong mục [${categoryName}](/category/${slug}).`,
      `[${categoryName}](/category/${slug}) là chuyên mục nhận được nhiều quan tâm hiện nay.`,
      `Tin tức liên quan đến [${categoryName}](/category/${slug}) luôn được chúng tôi cập nhật sớm nhất.`,
      `Chuyên mục [${categoryName}](/category/${slug}) mang đến nhiều thông tin hữu ích.`,
      `[${categoryName}](/category/${slug}) là một trong những danh mục phổ biến trên trang tin tức.`,
      `Thông tin về [${categoryName}](/category/${slug}) được cập nhật liên tục tại đây.`,
    ];

    // Add category-specific paragraphs for better context
    const specificParagraphs: { [key: string]: string[] } = {
      'Công nghệ': [
        `Công nghệ mới nhất trong lĩnh vực [${categoryName}](/category/${slug}) đang được cập nhật.`,
        `Chuyên mục [${categoryName}](/category/${slug}) mang đến những xu hướng công nghệ mới nhất.`,
      ],
      'Thể thao': [
        `Tin tức thể thao trong chuyên mục [${categoryName}](/category/${slug}) được cập nhật thường xuyên.`,
        `Chuyên mục [${categoryName}](/category/${slug}) cung cấp tin tức thể thao mới nhất.`,
      ],
      'Sức khỏe': [
        `Thông tin sức khỏe trong [${categoryName}](/category/${slug}) được cập nhật hàng ngày.`,
        `Chuyên mục [${categoryName}](/category/${slug}) mang đến những lời khuyên sức khỏe hữu ích.`,
      ],
      'Ô tô': [
        `Tin tức ô tô trong [${categoryName}](/category/${slug}) được cập nhật mới nhất.`,
        `Chuyên mục [${categoryName}](/category/${slug}) cung cấp thông tin về xe hơi và công nghệ ô tô.`,
      ],
      'Giải trí': [
        `Tin tức giải trí trong [${categoryName}](/category/${slug}) được cập nhật thường xuyên.`,
        `Chuyên mục [${categoryName}](/category/${slug}) mang đến những tin tức giải trí nóng hổi.`,
      ],
      'Game': [
        `Tin tức game trong [${categoryName}](/category/${slug}) được cập nhật mới nhất.`,
        `Chuyên mục [${categoryName}](/category/${slug}) cung cấp tin tức về game và esports.`,
      ],
    };

    // Combine base paragraphs with category-specific ones
    const specific = specificParagraphs[categoryName] || [];
    return [...baseParagraphs, ...specific];
  };

  const categoryParagraphs = getCategoryParagraphs(category, categorySlug);

  // Select random paragraph based on articleId hash for consistency
  const getRandomIndex = (max: number, seed: string): number => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % max;
  };

  // Use articleSlug as seed for consistent selection per article
  const seed = articleSlug || 'default';
  const homeParagraph = homeParagraphs[getRandomIndex(homeParagraphs.length, seed + 'home')];
  const categoryParagraph = categoryParagraphs[getRandomIndex(categoryParagraphs.length, seed + 'category')];

  // Strategy 1: Add self link by finding keyword in content (natural replacement)
  if (selfAnchor && selfAnchor.length > 2) {
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const selfAnchorEscaped = escapeRegex(selfAnchor);
    
    for (let i = 0; i < lines.length; i++) {
      if (isValidParagraph(lines[i], 40)) {
        const line = lines[i];
        const regex = new RegExp(`\\b(${selfAnchorEscaped})\\b`, 'i');
        if (regex.test(line) && !line.includes('](/articles/')) {
          lines[i] = line.replace(regex, `[$1](/articles/${articleSlug})`);
          selfAdded = true;
          console.log(`✅ Added self link: "${selfAnchor}" → /articles/${articleSlug}`);
          break;
        }
      }
    }
  }

  // Strategy 2: Find paragraphs in middle section and insert new paragraphs after them
  // This is more natural than appending to existing paragraphs
  // IMPORTANT: Ensure home and category links are at least 3-4 paragraphs apart
  const middleStart = Math.floor(lines.length * 0.3);
  const middleEnd = Math.floor(lines.length * 0.7);
  
  let homeInsertIndex = -1;
  let categoryInsertIndex = -1;
  const suitableIndices: number[] = [];
  
  // First pass: Find best position for home link
  for (let i = middleStart; i < middleEnd && i < lines.length; i++) {
    if (isValidParagraph(lines[i], 50)) {
      // Check if paragraph mentions information/sources (good context for home link)
      if (!homeAdded && /(thông tin|theo|nguồn|cho biết|xác nhận|báo cáo)/i.test(lines[i])) {
        homeInsertIndex = i;
        break;
      }
      
      // Collect suitable indices for category link
      if (!categoryAdded) {
        suitableIndices.push(i);
      }
    }
  }
  
  // If no perfect match for home link, use first suitable paragraph in middle
  if (homeInsertIndex === -1 && !homeAdded) {
    for (let i = middleStart; i < middleEnd && i < lines.length; i++) {
      if (isValidParagraph(lines[i], 50)) {
        homeInsertIndex = i;
        break;
      }
    }
  }

  // Second pass: Find best position for category link (at least 4 paragraphs away from home)
  const minDistance = 4; // Minimum paragraphs between links
  
  if (homeInsertIndex >= 0) {
    // If home link is in first half, put category in second half
    if (homeInsertIndex < Math.floor(lines.length / 2)) {
      // Category should be in second half (60-80% of content)
      const categoryStart = Math.floor(lines.length * 0.6);
      const categoryEnd = Math.floor(lines.length * 0.8);
      
      for (let i = categoryStart; i < categoryEnd && i < lines.length; i++) {
        if (isValidParagraph(lines[i], 50) && Math.abs(i - homeInsertIndex) >= minDistance) {
          categoryInsertIndex = i;
          break;
        }
      }
    } else {
      // Home link is in second half, put category in first half (20-40% of content)
      const categoryStart = Math.floor(lines.length * 0.2);
      const categoryEnd = Math.floor(lines.length * 0.4);
      
      for (let i = categoryEnd - 1; i >= categoryStart && i >= 0; i--) {
        if (isValidParagraph(lines[i], 50) && Math.abs(homeInsertIndex - i) >= minDistance) {
          categoryInsertIndex = i;
          break;
        }
      }
    }
  } else {
    // No home link yet, find category position in middle section
    if (suitableIndices.length > 0) {
      categoryInsertIndex = suitableIndices[Math.floor(suitableIndices.length / 2)];
    }
  }

  // Insert home paragraph
  if (homeInsertIndex >= 0 && !homeAdded) {
    lines.splice(homeInsertIndex + 1, 0, '', homeParagraph);
    homeAdded = true;
    console.log(`✅ Inserted home paragraph after paragraph ${homeInsertIndex + 1}`);
    
    // Adjust category index if it comes after home (need to account for inserted lines)
    if (categoryInsertIndex > homeInsertIndex) {
      categoryInsertIndex += 2; // Account for inserted paragraph + blank line
    }
  }

  // Insert category paragraph (ensure it's at least 4 paragraphs away from home)
  if (categoryInsertIndex >= 0 && !categoryAdded) {
    // Double check distance if home was inserted
    if (homeInsertIndex >= 0 && Math.abs(categoryInsertIndex - homeInsertIndex) < minDistance) {
      // Find alternative position
      const alternativeStart = categoryInsertIndex > homeInsertIndex 
        ? Math.max(0, homeInsertIndex - minDistance)
        : Math.min(lines.length - 1, homeInsertIndex + minDistance + 2);
      
      for (let i = alternativeStart; i < lines.length && i >= 0; i += categoryInsertIndex > homeInsertIndex ? -1 : 1) {
        if (isValidParagraph(lines[i], 50) && Math.abs(i - homeInsertIndex) >= minDistance) {
          categoryInsertIndex = i;
          break;
        }
      }
    }
    
    lines.splice(categoryInsertIndex + 1, 0, '', categoryParagraph);
    categoryAdded = true;
    console.log(`✅ Inserted category paragraph after paragraph ${categoryInsertIndex + 1} (distance from home: ${homeInsertIndex >= 0 ? Math.abs(categoryInsertIndex - homeInsertIndex) : 'N/A'})`);
  }

  // Strategy 3: If not added, find suitable paragraphs after introduction
  // Ensure links are distributed (not close together)
  if (!homeAdded || !categoryAdded) {
    let homeCandidate = -1;
    let categoryCandidate = -1;
    const introParagraphs: number[] = [];
    
    // Collect suitable paragraphs after introduction
    for (let i = 3; i < Math.min(15, lines.length); i++) {
      if (isValidParagraph(lines[i], 60)) {
        const line = lines[i];
        
        if (!homeAdded && !line.includes('Ctrl Z') && !line.includes('trang tin tức') && homeCandidate === -1) {
          homeCandidate = i;
        }
        
        if (!categoryAdded && !line.includes(`/${categorySlug}`) && categoryCandidate === -1) {
          introParagraphs.push(i);
        }
      }
    }
    
    // Insert home link first if found
    if (homeCandidate >= 0 && !homeAdded) {
      lines.splice(homeCandidate + 1, 0, '', homeParagraph);
      homeAdded = true;
      console.log(`✅ Inserted home paragraph after paragraph ${homeCandidate + 1} (after intro)`);
      
      // Find category position at least 3 paragraphs away
      for (const idx of introParagraphs) {
        if (Math.abs(idx - homeCandidate) >= 3) {
          categoryCandidate = idx;
          break;
        }
      }
      
      // If no good position after intro, category will be handled in Strategy 4
      if (categoryCandidate >= 0 && !categoryAdded) {
        // Adjust index if it comes after home
        if (categoryCandidate > homeCandidate) {
          categoryCandidate += 2;
        }
        lines.splice(categoryCandidate + 1, 0, '', categoryParagraph);
        categoryAdded = true;
        console.log(`✅ Inserted category paragraph after paragraph ${categoryCandidate + 1} (after intro, distance: ${Math.abs(categoryCandidate - homeCandidate)})`);
      }
    } else if (introParagraphs.length > 0 && !categoryAdded) {
      // Only category link to add
      categoryCandidate = introParagraphs[Math.floor(introParagraphs.length / 2)];
      lines.splice(categoryCandidate + 1, 0, '', categoryParagraph);
      categoryAdded = true;
      console.log(`✅ Inserted category paragraph after paragraph ${categoryCandidate + 1} (after intro)`);
    }
  }

  // Strategy 4: Fallback - insert before last paragraph (more natural than at very end)
  // Ensure links are at least 3 paragraphs apart even in fallback
  if (!homeAdded || !categoryAdded) {
    const fallbackParagraphs: number[] = [];
    
    // Collect suitable paragraphs from end
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 10); i--) {
      if (isValidParagraph(lines[i], 40)) {
        fallbackParagraphs.push(i);
      }
    }
    
    if (fallbackParagraphs.length > 0) {
      if (!homeAdded) {
        // Use second-to-last or middle of fallback range
        const homeIndex = fallbackParagraphs.length > 2 
          ? fallbackParagraphs[Math.floor(fallbackParagraphs.length / 2)]
          : fallbackParagraphs[fallbackParagraphs.length - 1];
        
        if (!lines[homeIndex].includes('Ctrl Z') && !lines[homeIndex].includes('trang tin tức')) {
          lines.splice(homeIndex, 0, '', homeParagraph);
          homeAdded = true;
          console.log(`✅ Inserted home paragraph before paragraph ${homeIndex + 1} (fallback)`);
          
          // Find category position at least 3 paragraphs away
          let categoryIndex = -1;
          for (const idx of fallbackParagraphs) {
            if (Math.abs(idx - homeIndex) >= 3 && !lines[idx].includes(`/${categorySlug}`)) {
              categoryIndex = idx > homeIndex ? idx + 2 : idx; // Adjust if after home
              break;
            }
          }
          
          if (categoryIndex >= 0 && !categoryAdded) {
            lines.splice(categoryIndex, 0, '', categoryParagraph);
            categoryAdded = true;
            console.log(`✅ Inserted category paragraph (fallback, distance from home: ${Math.abs(categoryIndex - homeIndex)})`);
          }
        }
      } else if (!categoryAdded) {
        // Only category to add, use last suitable paragraph
        const categoryIndex = fallbackParagraphs[0];
        if (!lines[categoryIndex].includes(`/${categorySlug}`)) {
          lines.splice(categoryIndex, 0, '', categoryParagraph);
          categoryAdded = true;
          console.log(`✅ Inserted category paragraph (fallback)`);
        }
      }
    }
  }

  // Fallback for self link - add as separate sentence in paragraph
  if (!selfAdded && selfAnchor) {
    for (let i = 0; i < lines.length; i++) {
      if (isValidParagraph(lines[i], 50)) {
        // Add as a separate sentence within the paragraph (more natural)
        const sentence = ` Để biết thêm chi tiết về [${selfAnchor}](/articles/${articleSlug}), bạn có thể xem thêm tại đây.`;
        lines[i] = lines[i] + sentence;
        selfAdded = true;
        console.log(`✅ Added self link sentence: ${selfAnchor}`);
        break;
      }
    }
  }

  return lines.join('\n');
}

/**
 * Extract keywords from content using AI (better than just tags)
 */
async function extractKeywordsFromContent(content: string, title: string): Promise<string[]> {
  try {
    // Get Google AI keys
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

    const googleApiKeys = getGoogleAIKeys();
    if (googleApiKeys.length === 0) {
      return [];
    }

    // Get content snippet (first 1000 chars)
    const contentSnippet = content.substring(0, 1000).replace(/#|!\[|\[|\]|\(|\)/g, ' ').trim();

    const prompt = `Phân tích nội dung bài viết và trích xuất 5-8 từ khóa chính (keywords) quan trọng nhất.

Tiêu đề: "${title}"

Đoạn đầu nội dung:
"${contentSnippet}"

YÊU CẦU:
- Trích xuất 5-8 từ khóa chính (keywords) là danh từ, tên riêng, thuật ngữ quan trọng trong bài viết
- Từ khóa phải có ý nghĩa, dài ít nhất 2 từ (ví dụ: "iPhone 15", "VinFast VF 7", "Cristiano Ronaldo")
- Không bao gồm các từ chung chung như "tin tức", "bài viết", "người dùng"
- Ưu tiên tên riêng, sản phẩm, sự kiện, nhân vật

Format trả về (mỗi từ khóa một dòng, KHÔNG đánh số):
KEYWORD_1
KEYWORD_2
KEYWORD_3
...

VÍ DỤ:
Tiêu đề: "iPhone 15 Ra Mắt Với Chip A17 Pro Mạnh Mẽ"
KEYWORD_1: iPhone 15
KEYWORD_2: Chip A17 Pro
KEYWORD_3: Apple
KEYWORD_4: smartphone

Tiêu đề: "VinFast VF 7 Hoàn Thành Hành Trình 50.000km"
KEYWORD_1: VinFast VF 7
KEYWORD_2: xe điện
KEYWORD_3: Việt Nam

Trả về NGAY theo format (KHÔNG giải thích):`;

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    let response;
    let lastError;
    
    for (let keyIndex = 0; keyIndex < googleApiKeys.length; keyIndex++) {
      const selectedKey = googleApiKeys[keyIndex];
      const keyNumber = keyIndex + 1;
      
      try {
        const genAI = new GoogleGenerativeAI(selectedKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
        
        const result = await model.generateContent(prompt);
        response = result.response.text().trim();
        
        console.log(`✅ Extracted keywords with Key #${keyNumber}`);
        break;
        
      } catch (error: any) {
        const isQuotaError = error.message?.includes('429') || 
                             error.message?.includes('quota') ||
                             error.message?.includes('Too Many Requests');
        
        if (isQuotaError) {
          console.log(`⚠️ Key #${keyNumber} quota exceeded, trying next key...`);
          lastError = error;
          continue;
        } else {
          throw error;
        }
      }
    }
    
    if (!response) {
      throw lastError || new Error('All Google AI keys quota exceeded');
    }

    // Parse keywords (one per line)
    const keywords = response
      .split('\n')
      .map(line => line.replace(/^KEYWORD_\d+:\s*/i, '').trim())
      .filter(k => k.length > 2 && !k.match(/^(KEYWORD|VÍ DỤ|YÊU CẦU)/i))
      .slice(0, 8);

    console.log(`🔑 Extracted ${keywords.length} keywords from content:`, keywords);
    return keywords;
  } catch (error: any) {
    console.error('❌ Error extracting keywords:', error.message);
    return [];
  }
}

/**
 * Get random articles from same category
 */
async function getRandomCategoryArticles(
  category: string,
  excludeSlug: string,
  count: number = 2
): Promise<Array<{ slug: string; title: string }>> {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase/server');
    
    if (!category) {
      return [];
    }

    // Get articles from same category
    const { data: articles, error } = await supabaseAdmin
      .from('articles')
      .select('slug, title')
      .eq('published', true)
      .eq('category', category)
      .neq('slug', excludeSlug)
      .order('created_at', { ascending: false })
      .limit(count * 5); // Get more to randomize

    if (error) {
      console.error('❌ Error finding category articles:', error);
      return [];
    }

    if (!articles || articles.length === 0) {
      return [];
    }

    // Randomize and select
    const shuffled = [...articles].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    console.log(`📚 Found ${selected.length} random articles from category "${category}"`);
    return selected;
  } catch (error) {
    console.error('❌ Error in getRandomCategoryArticles:', error);
    return [];
  }
}

/**
 * Add "Xem thêm" blocks to content
 * Inserts 2 blocks with random articles from same category
 */
function addRelatedArticleBlocks(
  content: string,
  relatedArticles: Array<{ slug: string; title: string }>
): string {
  if (!relatedArticles || relatedArticles.length === 0) {
    return content;
  }

  const lines = content.split('\n');
  let blocksAdded = 0;
  const maxBlocks = 2;
  const minDistance = 8; // Minimum paragraphs between blocks

  // Helper: Check if line is a valid paragraph
  const isValidParagraph = (line: string, minLength = 30): boolean => {
    const trimmed = line.trim();
    return trimmed.length >= minLength &&
           !trimmed.startsWith('#') &&
           !trimmed.startsWith('```') &&
           !trimmed.startsWith('![') &&
           !trimmed.startsWith('*') &&
           !trimmed.includes('Xem thêm:') && // Don't insert if already has block
           !trimmed.includes('](/articles/') &&
           !trimmed.includes('](/category/') &&
           !trimmed.includes('](/');
  };

  // Find suitable positions (middle sections of article)
  const validPositions: number[] = [];
  const contentLength = lines.length;
  
  // First block: around 30-40% of content
  const firstBlockStart = Math.floor(contentLength * 0.3);
  const firstBlockEnd = Math.floor(contentLength * 0.4);
  
  // Second block: around 60-70% of content
  const secondBlockStart = Math.floor(contentLength * 0.6);
  const secondBlockEnd = Math.floor(contentLength * 0.7);

  // Collect valid positions for first block
  for (let i = firstBlockStart; i < firstBlockEnd && i < contentLength; i++) {
    if (isValidParagraph(lines[i], 40)) {
      validPositions.push(i);
    }
  }

  // Collect valid positions for second block
  for (let i = secondBlockStart; i < secondBlockEnd && i < contentLength; i++) {
    if (isValidParagraph(lines[i], 40)) {
      validPositions.push(i);
    }
  }

  // Insert blocks
  const insertedIndices: number[] = [];
  
  for (let blockIndex = 0; blockIndex < Math.min(maxBlocks, relatedArticles.length) && blockIndex < validPositions.length; blockIndex++) {
    const article = relatedArticles[blockIndex];
    
    // Find position that's far enough from previous insertions
    let insertIndex = -1;
    for (const pos of validPositions) {
      if (insertedIndices.length === 0) {
        // First block - use first valid position
        insertIndex = pos;
        break;
      } else {
        // Check distance from previous insertions
        const farEnough = insertedIndices.every(prevIndex => Math.abs(pos - prevIndex) >= minDistance);
        if (farEnough && pos > insertedIndices[insertedIndices.length - 1]) {
          insertIndex = pos;
          break;
        }
      }
    }

    // Fallback: use middle positions
    if (insertIndex === -1) {
      if (blockIndex === 0) {
        insertIndex = Math.floor(contentLength * 0.35);
      } else {
        insertIndex = Math.floor(contentLength * 0.65);
      }
    }

    if (insertIndex >= 0 && insertIndex < contentLength) {
      // Create "Xem thêm" block
      const blockMarkdown = `\n\n> **Xem thêm:** [${article.title}](/articles/${article.slug})\n\n`;
      
      // Insert after this paragraph
      lines.splice(insertIndex + 1, 0, blockMarkdown);
      insertedIndices.push(insertIndex);
      blocksAdded++;
      
      console.log(`✅ Added "Xem thêm" block #${blockIndex + 1} after paragraph ${insertIndex + 1}: "${article.title}"`);
      
      // Adjust subsequent positions (account for inserted lines)
      for (let j = blockIndex + 1; j < insertedIndices.length; j++) {
        if (insertedIndices[j] > insertIndex) {
          insertedIndices[j] += 1; // +1 for the inserted block
        }
      }
    }
  }

  return lines.join('\n');
}

/**
 * Main function: Add internal linking to article content
 * Now uses: Fixed links (homepage, category, self) + "Xem thêm" blocks
 * @param content - Original markdown content
 * @param title - Article title
 * @param articleId - Current article ID (or slug)
 * @param tags - Article tags (keywords from AI or manual input)
 * @param category - Article category
 * @param articleSlug - Article slug for self-link
 * @returns Modified content with internal links
 */
export async function addKeywordLinks(
  content: string,
  title: string,
  articleId: string,
  tags: string[] = [],
  category?: string,
  articleSlug?: string
): Promise<string> {
  try {
    console.log('🔗 Adding internal links (fixed links + "Xem thêm" blocks)...');

    // Get main keyword for self-link (simple extraction)
    const mainKeyword = getMainKeyword(title, tags);
    
    console.log(`📝 Main keyword: "${mainKeyword}"`);
    console.log(`📁 Category: "${category || 'N/A'}"`);
    console.log(`🔗 Article slug: "${articleSlug || articleId}"`);

    // Convert category to slug
    const categorySlug = category ? categoryToSlug(category) : 'cong-nghe';
    const finalArticleSlug = articleSlug || articleId.replace('temp-', '');

    // Step 1: Add fixed links (homepage, category, self)
    let modifiedContent = addFixedLinks(
      content,
      category || 'Tin tức',
      categorySlug,
      mainKeyword,
      finalArticleSlug
    );

    const fixedLinksCount = (modifiedContent.match(/\[.+?\]\([\/\w-]+\)/g) || []).length - 
                           (content.match(/\[.+?\]\([\/\w-]+\)/g) || []).length;
    
    console.log(`✅ Added ${fixedLinksCount} fixed links (homepage, category, self)`);

    // Step 2: Add "Xem thêm" blocks with random articles from same category
    if (category && content.length > 300) { // Only if content is substantial
      console.log('📚 Getting random articles from same category...');
      
      const relatedArticles = await getRandomCategoryArticles(
        category,
        finalArticleSlug,
        2 // Get 2 random articles
      );
      
      if (relatedArticles.length > 0) {
        modifiedContent = addRelatedArticleBlocks(
          modifiedContent,
          relatedArticles
        );
        console.log(`✅ Added ${relatedArticles.length} "Xem thêm" blocks`);
      } else {
        console.log('⚠️ No related articles found in same category');
      }
    }

    return modifiedContent;
  } catch (error) {
    console.error('❌ Error in addKeywordLinks:', error);
    return content; // Return original content on error
  }
}


