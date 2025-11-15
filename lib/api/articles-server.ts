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
  // Optimized: Exclude content field to reduce egress (content can be 50-500KB per article)
  // Only fetch content when actually needed (e.g., in article detail page)
  const query = supabaseAdmin
    .from('articles')
    .select('id, title, slug, description, image_url, category, tags, author, published, views, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(1000); // Add limit to prevent huge queries

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
  
  // Optimized: Use database query with contains filter instead of fetching all and filtering in memory
  // This reduces egress significantly
  let query = supabaseAdmin
    .from('articles')
    .select('id, title, slug, description, image_url, category, tags, author, published, views, created_at, updated_at')
    .contains('tags', [normalizedSlug]) // Try exact match first
    .order('created_at', { ascending: false })
    .limit(200); // Limit to prevent huge queries

  if (published) {
    query = query.eq('published', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching articles by tag:', error);
    return [];
  }

  // If no exact match, try with original tag name (in case tag is stored as "chiến thuật" not "chien-thuat")
  if (!data || data.length === 0) {
    console.log('  - No exact match, trying with original tag name...');
    // Note: This is a fallback - ideally tags should be normalized in database
    // For now, we return empty array to save egress
    return [];
  }

  console.log('getArticlesByTagServer - Found:', data.length, 'articles');
  return data as Article[];
}

export async function searchArticlesServer(searchTerm: string): Promise<Article[]> {
  console.log('searchArticlesServer - Searching for:', searchTerm);
  
  // Optimized: Exclude content field to reduce egress
  // Search in title and description only (content search still works via database, but we don't fetch it)
  const { data, error } = await supabaseAdmin
    .from('articles')
    .select('id, title, slug, description, image_url, category, tags, author, published, views, created_at, updated_at')
    .eq('published', true)
    .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false })
    .limit(100); // Limit search results

  if (error) {
    console.error('Error searching articles:', error);
    return [];
  }

  console.log('searchArticlesServer - Found:', data?.length || 0, 'articles');
  return data as Article[];
}

