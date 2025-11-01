import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Article } from '@/lib/types/article';

/**
 * Cache configuration
 */
const CACHE_TTL = 60; // 60 seconds for frequently accessed data
const LONG_CACHE_TTL = 300; // 5 minutes for less frequently accessed data

/**
 * React Cache - Deduplicates requests within the same render
 * This prevents duplicate queries in the same request
 */
export const getArticlesCached = cache(async (published = true): Promise<Article[]> => {
  const query = supabaseAdmin
    .from('articles')
    .select('id, title, slug, description, image_url, category, tags, author, views, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(500); // Limit to prevent huge queries

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
    const query = supabaseAdmin
      .from('articles')
      .select('id, title, slug, description, image_url, category, tags, author, views, created_at, updated_at')
      .eq('category', category)
      .order('created_at', { ascending: false })
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
    tags: ['articles'],
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
 */
function tagMatchesSlug(tag: string, tagSlug: string): boolean {
  // Normalize inputs
  const normalizedTag = tag.toLowerCase().trim();
  const normalizedSlug = tagSlug.toLowerCase().trim();
  
  // Exact match (tag name or slug)
  if (normalizedTag === normalizedSlug) return true;
  
  // Convert tag to slug and match
  const tagAsSlug = tagToSlug(tag);
  if (tagAsSlug === normalizedSlug) return true;
  
  // Convert slug back to readable format and match
  const slugAsReadable = normalizedSlug.replace(/-/g, ' ');
  if (normalizedTag === slugAsReadable) return true;
  
  // Partial match (slug contains tag or vice versa)
  if (normalizedTag.includes(normalizedSlug) || normalizedSlug.includes(normalizedTag)) return true;
  if (tagAsSlug.includes(normalizedSlug) || normalizedSlug.includes(tagAsSlug)) return true;
  
  return false;
}

/**
 * Get articles by tag (optimized with smart matching)
 * Handles both full tag names ("chiến thuật") and slugs ("chien-thuat")
 */
export const getArticlesByTagCached = unstable_cache(
  async (tagSlug: string, published = true): Promise<Article[]> => {
    console.log(`🔍 Searching for tag slug: "${tagSlug}"`);
    
    // Try exact match first with PostgreSQL contains
    // This works if tag in DB is exactly the slug (e.g., "chien-thuat")
    const exactQuery = supabaseAdmin
      .from('articles')
      .select('id, title, slug, description, image_url, category, tags, author, views, created_at, updated_at')
      .eq('published', published)
      .contains('tags', [tagSlug])
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: exactData, error: exactError } = await exactQuery;

    if (!exactError && exactData && exactData.length > 0) {
      console.log(`✅ Found ${exactData.length} articles with exact tag match`);
      return exactData as Article[];
    }

    // Fallback: Get articles and filter in memory with smart matching
    // This handles tags like "chiến thuật" matching slug "chien-thuat"
    console.log('⚠️ Exact match failed, using smart memory filter...');
    
    const fallbackQuery = supabaseAdmin
      .from('articles')
      .select('id, title, slug, description, image_url, category, tags, author, views, created_at, updated_at')
      .eq('published', published)
      .order('created_at', { ascending: false })
      .limit(500);

    const { data: allData, error: fallbackError } = await fallbackQuery;

    if (fallbackError) {
      console.error('❌ Error fetching articles for tag filter:', fallbackError);
      return [];
    }

    if (!allData || allData.length === 0) {
      console.log('⚠️ No articles found');
      return [];
    }

    // Smart filtering: match tag name or slug format
    const filtered = (allData || []).filter((article) => {
      if (!article.tags || !Array.isArray(article.tags)) return false;
      
      return article.tags.some((tag: string) => tagMatchesSlug(tag, tagSlug));
    });

    console.log(`✅ Found ${filtered.length} articles with smart tag matching (from ${allData.length} total)`);
    
    // Log some matches for debugging
    if (filtered.length > 0 && filtered.length <= 10) {
      filtered.forEach(article => {
        const matchingTags = article.tags.filter((tag: string) => tagMatchesSlug(tag, tagSlug));
        console.log(`   - "${article.title}" (tags: ${matchingTags.join(', ')})`);
      });
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

    // Increment views asynchronously (don't await)
    Promise.resolve(
      supabaseAdmin
        .from('articles')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', data.id)
    )
      .then(() => {
        // Success - views updated
      })
      .catch((viewError: any) => {
        console.warn('Could not increment views:', viewError);
      });

    return data as Article;
  },
  ['article-by-slug'],
  {
    revalidate: CACHE_TTL,
    tags: ['articles'],
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
      .limit(1000); // Sample to calculate popular tags

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

