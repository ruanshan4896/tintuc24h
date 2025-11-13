import { supabaseAdmin } from '@/lib/supabase/server';
import { CreateArticleInput, UpdateArticleInput } from '@/lib/types/article';
import { triggerRevalidate } from '@/lib/api/revalidate';
import { getCategorySlug, toSlug } from '@/lib/utils/slug';

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

  const revalidatePathsCreate: string[] = [];
  if (data?.slug) {
    revalidatePathsCreate.push(`/articles/${data.slug}`);
  }
  if (data?.category) {
    revalidatePathsCreate.push(`/category/${getCategorySlug(data.category)}`);
  }
  if (Array.isArray(data?.tags)) {
    data.tags.forEach((tag: string) => {
      const slug = toSlug(tag);
      if (slug) {
        revalidatePathsCreate.push(`/tag/${slug}`);
      }
    });
  }

  await triggerRevalidate(revalidatePathsCreate, {
    logLabel: 'admin-create-article',
  });

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

  const revalidatePathsUpdate: string[] = [];
  if (data?.slug) {
    revalidatePathsUpdate.push(`/articles/${data.slug}`);
  }
  if (data?.category) {
    revalidatePathsUpdate.push(`/category/${getCategorySlug(data.category)}`);
  }
  if (Array.isArray(data?.tags)) {
    data.tags.forEach((tag: string) => {
      const slug = toSlug(tag);
      if (slug) {
        revalidatePathsUpdate.push(`/tag/${slug}`);
      }
    });
  }

  await triggerRevalidate(revalidatePathsUpdate, {
    logLabel: 'admin-update-article',
  });

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

  await triggerRevalidate([], { logLabel: 'admin-delete-article' });

  return { success: true, error: null };
}

