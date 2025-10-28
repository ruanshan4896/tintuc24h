import { supabaseAdmin } from '@/lib/supabase/server';
import { CreateArticleInput, UpdateArticleInput } from '@/lib/types/article';

export async function createArticleAdmin(input: CreateArticleInput) {
  const { data, error } = await supabaseAdmin
    .from('articles')
    .insert([input])
    .select()
    .single();

  if (error) {
    console.error('Error creating article:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function updateArticleAdmin(input: UpdateArticleInput) {
  const { id, ...updateData } = input;
  
  const { data, error } = await supabaseAdmin
    .from('articles')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating article:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function deleteArticleAdmin(id: string) {
  const { error } = await supabaseAdmin
    .from('articles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting article:', error);
    return { success: false, error };
  }

  return { success: true, error: null };
}

