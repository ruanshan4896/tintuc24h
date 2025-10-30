import { supabaseAdmin } from '@/lib/supabase/server';
import { Article } from '@/lib/types/article';
import { toSlug } from '@/lib/utils/slug';

// Server-side functions using Service Role Key (bypass RLS)

export async function getArticleBySlugServer(slug: string): Promise<Article | null> {
  console.log('getArticleBySlugServer - Searching for slug:', slug);
  
  const { data, error } = await supabaseAdmin
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();

  console.log('getArticleBySlugServer - Data:', data ? 'FOUND' : 'NOT FOUND');
  console.log('getArticleBySlugServer - Error:', error);

  if (error) {
    console.error('Error fetching article:', error);
    return null;
  }

  if (!data) {
    console.log('getArticleBySlugServer - No data found for slug:', slug);
    return null;
  }

  // Increment views (non-blocking)
  try {
    await supabaseAdmin
      .from('articles')
      .update({ views: (data.views || 0) + 1 })
      .eq('id', data.id);
  } catch (viewError) {
    console.warn('Could not increment views:', viewError);
  }

  return data as Article;
}

export async function getArticlesServer(published = true): Promise<Article[]> {
  const query = supabaseAdmin
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (published) {
    query.eq('published', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching articles:', error);
    return [];
  }

  return data as Article[];
}

export async function getArticlesByTagServer(tagSlug: string, published = true): Promise<Article[]> {
  console.log('getArticlesByTagServer - Searching for tag slug:', tagSlug);
  
  // Normalize input: ensure it's a clean slug
  const normalizedSlug = toSlug(tagSlug);
  
  console.log('  - Normalized slug:', normalizedSlug);
  
  // Get all articles
  const query = supabaseAdmin
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (published) {
    query.eq('published', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching articles by tag:', error);
    return [];
  }

  // Filter articles by matching tag slug
  const filteredArticles = (data || []).filter((article) => {
    if (!article.tags || !Array.isArray(article.tags)) return false;
    
    // Check if any tag's slug matches the search slug
    // This handles both "chiến thuật" and "chien-thuat" in database
    return article.tags.some((tag: string) => {
      const tagSlug = toSlug(tag);
      const isMatch = tagSlug === normalizedSlug;
      
      if (isMatch) {
        console.log(`  ✅ Match found: "${tag}" → slug: "${tagSlug}"`);
      }
      
      return isMatch;
    });
  });

  console.log('getArticlesByTagServer - Found:', filteredArticles.length, 'articles');
  
  if (filteredArticles.length === 0) {
    console.warn('⚠️ No articles found for tag slug:', normalizedSlug);
    console.log('  - Check if tags in database match this slug');
  }
  
  return filteredArticles as Article[];
}

export async function searchArticlesServer(searchTerm: string): Promise<Article[]> {
  console.log('searchArticlesServer - Searching for:', searchTerm);
  
  const { data, error } = await supabaseAdmin
    .from('articles')
    .select('*')
    .eq('published', true)
    .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching articles:', error);
    return [];
  }

  console.log('searchArticlesServer - Found:', data?.length || 0, 'articles');
  return data as Article[];
}

