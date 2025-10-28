import { supabaseAdmin } from '@/lib/supabase/server';
import { Article } from '@/lib/types/article';

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

