import { supabase } from '@/lib/supabase/client';
import { Article, CreateArticleInput, UpdateArticleInput } from '@/lib/types/article';

/**
 * Get articles for Admin page (optimized - only essential fields)
 * @param published - Filter by published status (default: true)
 * @returns Array of articles with limited fields for fast loading
 */
export async function getArticlesForAdmin(published?: boolean): Promise<Partial<Article>[]> {
  // Check if Supabase is properly configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ SUPABASE NOT CONFIGURED!');
    return [];
  }

  console.log('🔍 Fetching articles for admin...');

  // Only select fields needed for admin list view (NOT content!)
  const query = supabase
    .from('articles')
    .select('id, title, slug, category, published, views, created_at')
    .order('created_at', { ascending: false })
    .limit(500); // Limit to last 500 articles for performance

  if (published !== undefined) {
    query.eq('published', published);
  }

  const { data, error } = await query;

  console.log('📊 Query result:', {
    dataCount: data?.length || 0,
    hasError: !!error,
    errorDetails: error ? {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    } : null
  });

  if (error) {
    console.error('❌ Error fetching articles:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return [];
  }

  return data as Partial<Article>[];
}

/**
 * Get articles with full content (for public pages)
 * @param published - Filter by published status (default: true)
 * @returns Array of complete articles
 */
export async function getArticles(published = true): Promise<Article[]> {
  // Check if Supabase is properly configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ SUPABASE NOT CONFIGURED!');
    console.error('Missing env vars:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
    });
    return [];
  }

  const query = supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (published) {
    query.eq('published', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Error fetching articles:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return [];
  }

  return data as Article[];
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  console.log('getArticleBySlug - Searching for slug:', slug);
  
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .maybeSingle(); // Changed from .single() to .maybeSingle()

  console.log('getArticleBySlug - Data:', data);
  console.log('getArticleBySlug - Error:', error);

  if (error) {
    console.error('Error fetching article:', error);
    return null;
  }

  if (!data) {
    console.log('getArticleBySlug - No data found for slug:', slug);
    return null;
  }

  // Increment views (non-blocking, ignore errors)
  try {
    await supabase
      .from('articles')
      .update({ views: (data.views || 0) + 1 })
      .eq('id', data.id);
  } catch (viewError) {
    console.warn('Could not increment views:', viewError);
  }

  return data as Article;
}

export async function getArticlesByCategory(category: string, published = true): Promise<Article[]> {
  const query = supabase
    .from('articles')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (published) {
    query.eq('published', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching articles by category:', error);
    return [];
  }

  return data as Article[];
}

export async function searchArticles(searchTerm: string): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('published', true)
    .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching articles:', error);
    return [];
  }

  return data as Article[];
}

export async function createArticle(input: CreateArticleInput): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .insert([input])
    .select()
    .single();

  if (error) {
    console.error('Error creating article:', error);
    return null;
  }

  return data as Article;
}

export async function updateArticle(input: UpdateArticleInput): Promise<Article | null> {
  const { id, ...updateData } = input;
  
  const { data, error } = await supabase
    .from('articles')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating article:', error);
    return null;
  }

  return data as Article;
}

export async function deleteArticle(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting article:', error);
    return false;
  }

  return true;
}

export async function getCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('category')
    .eq('published', true);

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  const categories = [...new Set(data.map(item => item.category))];
  return categories;
}

/**
 * Get related articles based on category, tags, and recency
 * @param currentArticleId - ID of current article (to exclude)
 * @param category - Category of current article
 * @param tags - Tags of current article
 * @param limit - Number of related articles to return (default: 4)
 * @returns Array of related articles
 */
export async function getRelatedArticles(
  currentArticleId: string,
  category: string,
  tags: string[] = [],
  limit: number = 4
): Promise<Article[]> {
  try {
    // Get articles from same category (excluding current)
    const { data: categoryArticles, error: categoryError } = await supabase
      .from('articles')
      .select('*')
      .eq('published', true)
      .eq('category', category)
      .neq('id', currentArticleId)
      .order('created_at', { ascending: false })
      .limit(20); // Get more for scoring

    if (categoryError) {
      console.error('Error fetching related articles:', categoryError);
      return [];
    }

    if (!categoryArticles || categoryArticles.length === 0) {
      return [];
    }

    // Score articles based on:
    // - Same category: base score 70
    // - Shared tags: +30 per matching tag
    // - Recency: newer articles get slight boost
    const scoredArticles = categoryArticles.map((article) => {
      let score = 70; // Base score for same category

      // Tag matching (up to 30 points)
      if (article.tags && Array.isArray(article.tags) && tags.length > 0) {
        const matchingTags = article.tags.filter((tag: string) => 
          tags.includes(tag)
        ).length;
        score += matchingTags * 10; // 10 points per matching tag
      }

      // Recency bonus (up to 10 points)
      const daysSincePublished = Math.floor(
        (Date.now() - new Date(article.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      const recencyScore = Math.max(0, 10 - daysSincePublished / 10);
      score += recencyScore;

      return { ...article, score };
    });

    // Sort by score and return top N
    const topArticles = scoredArticles
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ score, ...article }) => article); // Remove score from result

    return topArticles as Article[];
  } catch (error) {
    console.error('Error in getRelatedArticles:', error);
    return [];
  }
}

