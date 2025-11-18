import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Article } from '@/lib/types/article';

/**
 * Cache configuration
 * Increased TTL to reduce database queries and egress
 */
const CACHE_TTL = 300; // 5 minutes for frequently accessed data (increased to reduce egress)
const LONG_CACHE_TTL = 1800; // 30 minutes for less frequently accessed data (increased to reduce egress)

/**
 * React Cache - Deduplicates requests within the same render
 * This prevents duplicate queries in the same request
 */
export const getArticlesCached = cache(async (published = true): Promise<Article[]> => {
  const query = supabaseAdmin
    .from('articles')
    .select('id, title, slug, description, image_url, category, tags, author, views, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(200); // Reduced from 500 to save egress

  if (published) {
    query.eq('published', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching cached articles:', error);
    return [];
  }

  return (data || []) as Article[];
});

/**
 * Get articles by category (cached and optimized)
 */
export const getArticlesByCategoryCached = unstable_cache(
  async (category: string, published = true): Promise<Article[]> => {
    // Optimized query - only select needed fields, use index
    // Order by created_at DESC (newest first)
    const query = supabaseAdmin
      .from('articles')
      .select('id, title, slug, description, image_url, category, tags, author, views, created_at, updated_at')
      .eq('category', category)
      .order('created_at', { ascending: false }) // Newest first
      .limit(50); // Limit per category

    if (published) {
      query.eq('published', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching cached articles by category:', error);
      return [];
    }

    return (data || []) as Article[];
  },
  ['articles-by-category'],
  {
    revalidate: CACHE_TTL,
    tags: ['articles', 'articles-by-category'],
  }
);

/**
 * Convert tag name to slug (for matching)
 */
function tagToSlug(tag: string): string {
  return tag
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Check if tag matches slug (handles both full tag name and slug format)
 * Uses exact matching only to avoid false positives
 */
function tagMatchesSlug(tag: string, tagSlug: string): boolean {
  // Normalize inputs
  const normalizedTag = tag.toLowerCase().trim();
  const normalizedSlug = tagSlug.toLowerCase().trim();
  
  // 1. Exact match (tag name or slug)
  if (normalizedTag === normalizedSlug) return true;
  
  // 2. Convert tag to slug and match exactly
  const tagAsSlug = tagToSlug(tag);
  if (tagAsSlug === normalizedSlug) return true;
  
  // 3. Convert slug back to readable format and match exactly
  const slugAsReadable = normalizedSlug.replace(/-/g, ' ');
  if (normalizedTag === slugAsReadable) return true;
  
  // 4. Word boundary match (e.g., "iphone 15" should match "iphone-15" but not "smartphone")
  // Check if tag slug matches as a complete word in the tag
  const tagWords = normalizedTag.split(/\s+/);
  const slugWords = normalizedSlug.split(/-/);
  
  // Check if all slug words appear as complete words in tag
  const allSlugWordsMatch = slugWords.every(slugWord => 
    tagWords.some(tagWord => tagWord === slugWord)
  );
  
  if (allSlugWordsMatch && slugWords.length > 0) return true;
  
  // 5. Check if tag words match slug (reverse)
  const allTagWordsMatch = tagWords.every(tagWord =>
    slugWords.some(slugWord => slugWord === tagWord)
  );
  
  if (allTagWordsMatch && tagWords.length > 0) return true;
  
  // No match - return false (removed partial match to avoid false positives)
  return false;
}

/**
 * Get articles by tag (optimized with smart matching)
 * Handles both full tag names ("chiến thuật") and slugs ("chien-thuat")
 */
export const getArticlesByTagCached = unstable_cache(
  async (tagSlug: string, published = true): Promise<Article[]> => {
    console.log(`🔍 Searching for tag slug: "${tagSlug}"`);
    
    // Normalize tag slug for consistent matching
    const normalizedSlug = tagSlug.toLowerCase().trim();
    
    // Strategy 1: Try exact slug match (e.g., "chien-thuat")
    const exactQuery1 = supabaseAdmin
      .from('articles')
      .select('id, title, slug, description, image_url, category, tags, author, views, created_at, updated_at')
      .eq('published', published)
      .contains('tags', [normalizedSlug])
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: exactData1, error: exactError1 } = await exactQuery1;

    if (!exactError1 && exactData1 && exactData1.length > 0) {
      console.log(`✅ Found ${exactData1.length} articles with exact slug match: "${normalizedSlug}"`);
      return exactData1 as Article[];
    }

    // Strategy 2: Try with slug converted to readable format (e.g., "chiến thuật")
    const slugAsReadable = normalizedSlug.replace(/-/g, ' ');
    const exactQuery2 = supabaseAdmin
      .from('articles')
      .select('id, title, slug, description, image_url, category, tags, author, views, created_at, updated_at')
      .eq('published', published)
      .contains('tags', [slugAsReadable])
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: exactData2, error: exactError2 } = await exactQuery2;

    if (!exactError2 && exactData2 && exactData2.length > 0) {
      console.log(`✅ Found ${exactData2.length} articles with readable format match: "${slugAsReadable}"`);
      return exactData2 as Article[];
    }

    // Fallback: Get articles and filter in memory with strict matching
    // Only use this if database queries fail (handles edge cases)
    console.log('⚠️ Database queries failed, using strict memory filter...');
    
    const fallbackQuery = supabaseAdmin
      .from('articles')
      .select('id, title, slug, description, image_url, category, tags, author, views, created_at, updated_at')
      .eq('published', published)
      .order('created_at', { ascending: false })
      .limit(200); // Reduced from 500 to save egress

    const { data: allData, error: fallbackError } = await fallbackQuery;

    if (fallbackError) {
      console.error('❌ Error fetching articles for tag filter:', fallbackError);
      return [];
    }

    if (!allData || allData.length === 0) {
      console.log('⚠️ No articles found');
      return [];
    }

    // Strict filtering: only exact matches (no partial matching)
    const filtered = (allData || []).filter((article) => {
      if (!article.tags || !Array.isArray(article.tags)) return false;
      
      return article.tags.some((tag: string) => tagMatchesSlug(tag, normalizedSlug));
    });

    console.log(`✅ Found ${filtered.length} articles with strict tag matching (from ${allData.length} total)`);
    
    // Log matches for debugging
    if (filtered.length > 0 && filtered.length <= 10) {
      filtered.forEach(article => {
        const matchingTags = article.tags.filter((tag: string) => tagMatchesSlug(tag, normalizedSlug));
        console.log(`   - "${article.title}" (matching tags: ${matchingTags.join(', ')})`);
      });
    } else if (filtered.length === 0) {
      console.log(`   - No articles matched tag slug: "${normalizedSlug}"`);
      if (allData.length > 0 && allData[0]?.tags) {
        console.log(`   - Sample tags from first article: ${allData[0].tags.slice(0, 3).join(', ')}`);
      }
    }

    return filtered as Article[];
  },
  ['articles-by-tag'],
  {
    revalidate: CACHE_TTL,
    tags: ['articles'],
  }
);

/**
 * Get article by slug (cached)
 */
export const getArticleBySlugCached = unstable_cache(
  async (slug: string): Promise<Article | null> => {
    // Use index on slug for faster lookup
    const { data, error } = await supabaseAdmin
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching cached article by slug:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    // Increment views asynchronously (don't await) - fire and forget
    // Use setTimeout to avoid blocking
    setTimeout(async () => {
      try {
        await supabaseAdmin
          .from('articles')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', data.id);
        // Success - views updated
      } catch (viewError: any) {
        // Silently fail - views are not critical
        if (process.env.NODE_ENV === 'development') {
          console.warn('Could not increment views:', viewError);
        }
      }
    }, 0);

    return data as Article;
  },
  ['article-by-slug'],
  {
    revalidate: CACHE_TTL,
    tags: ['articles', 'article-by-slug'],
  }
);

/**
 * Get related articles (cached and optimized)
 */
export const getRelatedArticlesCached = unstable_cache(
  async (
    currentArticleId: string,
    category: string,
    tags: string[] = [],
    limit: number = 4
  ): Promise<Article[]> => {
    // Single optimized query with better scoring
    const query = supabaseAdmin
      .from('articles')
      .select('id, title, slug, description, image_url, category, tags, author, views, created_at, updated_at')
      .eq('published', true)
      .eq('category', category)
      .neq('id', currentArticleId)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit * 3, 30)); // Get more for scoring

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching cached related articles:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Score articles (simpler scoring in memory, but with smaller dataset)
    const scoredArticles = data.map((article) => {
      let score = 50; // Base score for same category

      // Tag matching
      if (article.tags && Array.isArray(article.tags) && tags.length > 0) {
        const matchingTags = article.tags.filter((tag: string) => 
          tags.includes(tag)
        ).length;
        score += matchingTags * 20; // Higher weight for tags
      }

      // Recency bonus
      const daysSincePublished = Math.floor(
        (Date.now() - new Date(article.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      const recencyScore = Math.max(0, 30 - daysSincePublished / 2);
      score += recencyScore;

      return { ...article, score };
    });

    // Sort by score and return top N
    const topArticles = scoredArticles
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ score, ...article }) => article); // Remove score

    return topArticles as Article[];
  },
  ['related-articles'],
  {
    revalidate: LONG_CACHE_TTL, // Related articles can be cached longer
    tags: ['articles'],
  }
);

/**
 * Get popular tags (cached)
 */
export const getPopularTagsCached = unstable_cache(
  async (limit: number = 10): Promise<string[]> => {
    // Use a more efficient query - get distinct tags from published articles
    const { data, error } = await supabaseAdmin
      .from('articles')
      .select('tags')
      .eq('published', true)
      .limit(500); // Reduced from 1000 to save egress (still enough for popular tags)

    if (error) {
      console.error('Error fetching popular tags:', error);
      return [];
    }

    // Count tags
    const tagCounts: Record<string, number> = {};
    (data || []).forEach((article) => {
      if (article.tags && Array.isArray(article.tags)) {
        article.tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    // Return top N tags
    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag]) => tag);
  },
  ['popular-tags'],
  {
    revalidate: LONG_CACHE_TTL, // Tags don't change frequently
    tags: ['tags'],
  }
);

