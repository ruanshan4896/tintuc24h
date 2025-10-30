'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { updateArticle } from '@/lib/api/articles';
import ArticleForm from '@/components/ArticleForm';
import { Article, UpdateArticleInput } from '@/lib/types/article';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params); // Unwrap Promise
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadArticle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadArticle() {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      alert('Không tìm thấy bài viết!');
      router.push('/admin');
      return;
    }

    setArticle(data as Article);
    setLoading(false);
  }

  async function handleSubmit(data: any) {
    setSubmitting(true);
    
    try {
      const response = await fetch('/api/admin/articles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id,
          ...data,
        }),
      });

      const result = await response.json();

      if (response.ok && result.data) {
        // Revalidate sitemap after updating article
        try {
          await fetch('/api/admin/revalidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: '/sitemap.xml' }),
          });
          console.log('Sitemap revalidated');
        } catch (revalError) {
          console.warn('Could not revalidate sitemap:', revalError);
        }
        
        alert('Đã cập nhật bài viết thành công!');
        router.push('/admin');
        router.refresh();
      } else {
        alert(`Lỗi: ${result.error || 'Không thể cập nhật bài viết'}`);
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi kết nối! Vui lòng thử lại.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!article) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Chỉnh sửa bài viết</h1>
        <ArticleForm
          initialData={article}
          onSubmit={handleSubmit}
          loading={submitting}
        />
      </div>
    </div>
  );
}

