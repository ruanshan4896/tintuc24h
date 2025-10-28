import { supabase } from '@/lib/supabase/client';
import { Article, CreateArticleInput, UpdateArticleInput } from '@/lib/types/article';

export async function getArticles(published = true): Promise<Article[]> {
  const query = supabase
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

