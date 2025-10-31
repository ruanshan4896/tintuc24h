/**
 * Auto Keyword Linking Utility
 * Automatically add internal links to keywords in article content
 */

import { supabaseAdmin } from '@/lib/supabase/server';

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
 * Main function: Add automatic keyword links to article content
 * @param content - Original markdown content
 * @param title - Article title (not used - kept for backward compatibility)
 * @param articleId - Current article ID
 * @param tags - Article tags (keywords from AI or manual input)
 * @returns Modified content with internal links
 */
export async function addKeywordLinks(
  content: string,
  title: string,
  articleId: string,
  tags: string[] = []
): Promise<string> {
  try {
    console.log('🔗 Adding keyword links...');

    // Use tags as keywords (AI-generated, more accurate than extraction)
    let keywords: string[] = [];
    
    if (tags && tags.length > 0) {
      keywords = tags;
      console.log('📝 Using article tags as keywords:', keywords);
    } else {
      // Fallback: Extract keywords from title/content if no tags
      keywords = extractKeywords(title, content);
      console.log('📝 Extracted keywords (fallback):', keywords);
    }

    // Filter out invalid keywords BEFORE matching
    const stopWords = [
      'của', 'và', 'là', 'có', 'để', 'được', 'trong', 'tại', 'với', 'cho',
      'từ', 'về', 'theo', 'đã', 'sẽ', 'thì', 'này', 'đó', 'hay', 'hoặc',
      'the', 'and', 'for', 'with', 'new', 'all', 'more'
    ];
    
    keywords = keywords.filter(keyword => {
      const cleaned = keyword.trim().toLowerCase();
      
      // Remove pure numbers
      if (/^\d+$/.test(cleaned)) {
        console.log(`🗑️ Filtered out number: "${keyword}"`);
        return false;
      }
      
      // Remove too short keywords
      if (cleaned.length < 3) {
        console.log(`🗑️ Filtered out short keyword: "${keyword}"`);
        return false;
      }
      
      // Remove stop words
      if (stopWords.includes(cleaned)) {
        console.log(`🗑️ Filtered out stop word: "${keyword}"`);
        return false;
      }
      
      return true;
    });

    if (keywords.length === 0) {
      console.log('⏭️ No valid keywords after filtering');
      return content;
    }
    
    console.log(`✅ Valid keywords (${keywords.length}):`, keywords);

    // Step 2: Find matching articles
    const matches = await findMatchingArticles(keywords, articleId);
    console.log(`✅ Found ${matches.length} keyword matches`);

    if (matches.length === 0) {
      console.log('⏭️ No matching articles found');
      return content;
    }

    // Step 3: Add links to content
    const modifiedContent = addLinksToContent(content, matches);
    
    const linksAdded = (modifiedContent.match(/\[.+?\]\(\/articles\/.+?\)/g) || []).length - 
                       (content.match(/\[.+?\]\(\/articles\/.+?\)/g) || []).length;
    
    console.log(`🔗 Added ${linksAdded} internal links`);

    return modifiedContent;
  } catch (error) {
    console.error('❌ Error in addKeywordLinks:', error);
    return content; // Return original content on error
  }
}

