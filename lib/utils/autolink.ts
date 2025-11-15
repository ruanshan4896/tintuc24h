/**
 * Autolink Utility
 * 
 * Automatically links keywords in article content to other articles
 * that have those keywords as their main_keyword.
 */

import { Article } from '@/lib/types/article';

export interface KeywordLink {
  keyword: string;
  slug: string;
  title: string;
}

/**
 * Normalize keyword for matching (lowercase, remove diacritics)
 */
function normalizeKeyword(keyword: string): string {
  return keyword
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
}

/**
 * Check if text contains keyword (case-insensitive, handles diacritics)
 */
function containsKeyword(text: string, keyword: string): boolean {
  const normalizedText = normalizeKeyword(text);
  const normalizedKeyword = normalizeKeyword(keyword);
  
  // Exact word match (not substring)
  const wordBoundaryRegex = new RegExp(`\\b${normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return wordBoundaryRegex.test(normalizedText);
}

/**
 * Get all keyword links from published articles
 * Returns a map of normalized keyword -> article info
 * Cached for better performance
 */
export async function getKeywordLinks(): Promise<Map<string, KeywordLink>> {
  try {
    const { unstable_cache } = await import('next/cache');
    const { supabaseAdmin } = await import('@/lib/supabase/server');
    
    // Cached function to fetch keyword links
    // Note: unstable_cache cannot serialize Map, so we return array and convert to Map
    const fetchKeywordLinks = unstable_cache(
      async () => {
        // Get all published articles with main_keyword
        const { data, error } = await supabaseAdmin
          .from('articles')
          .select('id, slug, title, main_keyword')
          .eq('published', true)
          .not('main_keyword', 'is', null)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching keyword links:', error);
          return [];
        }

        const keywordArray: Array<[string, KeywordLink]> = [];
        const seenKeywords = new Set<string>();

        (data || []).forEach((article: any) => {
          if (article.main_keyword && article.slug && article.title) {
            const normalized = normalizeKeyword(article.main_keyword);
            
            // Only add if not already exists (prefer newer articles)
            if (!seenKeywords.has(normalized)) {
              seenKeywords.add(normalized);
              keywordArray.push([
                normalized,
                {
                  keyword: article.main_keyword,
                  slug: article.slug,
                  title: article.title,
                },
              ]);
            }
          }
        });

        return keywordArray;
      },
      ['keyword-links'],
      {
        revalidate: 300, // Cache for 5 minutes
        tags: ['articles', 'keyword-links'],
      }
    );

    // Get cached array and convert to Map
    const keywordArray = await fetchKeywordLinks();
    
    // Ensure it's an array (handle case where cache returns something else)
    if (!Array.isArray(keywordArray)) {
      console.warn('Keyword links cache returned non-array, returning empty Map');
      return new Map();
    }
    
    // Convert array to Map
    return new Map<string, KeywordLink>(keywordArray);
  } catch (error) {
    console.error('Error in getKeywordLinks:', error);
    return new Map();
  }
}

/**
 * Apply autolinks to markdown content
 * 
 * Finds keywords in content and converts them to markdown links
 * Only links first occurrence of each keyword to avoid over-linking
 */
export function applyAutolinks(
  content: string,
  keywordLinks: Map<string, KeywordLink> | null | undefined,
  currentArticleSlug?: string // Exclude current article from linking
): string {
  // Validate inputs
  if (!content) {
    return content;
  }
  
  // Ensure keywordLinks is a Map
  if (!keywordLinks || !(keywordLinks instanceof Map)) {
    return content;
  }
  
  if (keywordLinks.size === 0) {
    return content;
  }

  let processedContent = content;
  const linkedKeywords = new Set<string>(); // Track which keywords have been linked

  // Sort keywords by length (longest first) to match longer phrases first
  const sortedKeywords = Array.from(keywordLinks.entries())
    .sort(([a], [b]) => b.length - a.length);

  // Process each keyword
  for (const [normalizedKeyword, linkInfo] of sortedKeywords) {
    // Skip if already linked or if it's the current article
    if (linkedKeywords.has(normalizedKeyword) || linkInfo.slug === currentArticleSlug) {
      continue;
    }

    // Escape special regex characters in keyword
    const escapedKeyword = linkInfo.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create pattern with word boundaries (case-insensitive)
    const keywordPattern = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');

    // Find all matches with their positions
    const matches: Array<{ match: string; index: number }> = [];
    let match;
    while ((match = keywordPattern.exec(processedContent)) !== null) {
      matches.push({
        match: match[0],
        index: match.index,
      });
    }

    // Process matches from end to start (to preserve indices)
    for (let i = matches.length - 1; i >= 0; i--) {
      const { match: matchedText, index } = matches[i];
      
      // Check if already inside a markdown link (avoid nested links)
      const beforeMatch = processedContent.substring(0, index);
      const afterMatch = processedContent.substring(index + matchedText.length);
      
      // Check for markdown link pattern: [text](url)
      const lastOpenBracket = beforeMatch.lastIndexOf('[');
      const lastCloseBracket = beforeMatch.lastIndexOf(']');
      const lastOpenParen = beforeMatch.lastIndexOf('(');
      const lastCloseParen = beforeMatch.lastIndexOf(')');

      // If we're inside a markdown link, skip
      if (
        lastOpenBracket > lastCloseBracket &&
        lastOpenParen > lastCloseBracket &&
        lastOpenParen < lastCloseParen
      ) {
        continue; // Skip, we're inside a link
      }

      // Also check if we're inside code blocks or inline code
      const beforeContext = processedContent.substring(Math.max(0, index - 50), index);
      const codeBlockPattern = /```[\s\S]*$/;
      const inlineCodePattern = /`[^`]*$/;
      
      if (codeBlockPattern.test(beforeContext) || inlineCodePattern.test(beforeContext)) {
        continue; // Skip if inside code
      }

      // Mark as linked (only first occurrence)
      if (!linkedKeywords.has(normalizedKeyword)) {
        linkedKeywords.add(normalizedKeyword);
        
        // Replace with markdown link
        processedContent = 
          processedContent.substring(0, index) +
          `[${matchedText}](/articles/${linkInfo.slug})` +
          processedContent.substring(index + matchedText.length);
        
        break; // Only link first occurrence
      }
    }
  }

  return processedContent;
}

/**
 * Extract main keyword from article title/content using simple heuristics
 * This is a fallback if AI doesn't provide main_keyword
 */
export function extractMainKeyword(title: string, tags: string[] = []): string | null {
  // Try to extract from title (first 3-5 words, remove common words)
  const commonWords = ['của', 'và', 'với', 'cho', 'từ', 'về', 'trong', 'là', 'có', 'được', 'sẽ', 'này', 'đó'];
  
  const titleWords = title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.includes(word))
    .slice(0, 5);

  if (titleWords.length > 0) {
    // Use first 2-3 words as keyword
    return titleWords.slice(0, 3).join(' ');
  }

  // Fallback to first tag
  if (tags.length > 0) {
    return tags[0];
  }

  return null;
}

