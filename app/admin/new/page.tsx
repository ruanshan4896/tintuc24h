'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ArticleForm from '@/components/ArticleForm';
import { CreateArticleInput } from '@/lib/types/article';

export default function NewArticlePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(data: CreateArticleInput) {
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.data) {
        // Revalidate sitemap after creating article
        try {
          await fetch('/api/revalidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: '/sitemap.xml' }),
          });
          console.log('Sitemap revalidated');
        } catch (revalError) {
          console.warn('Could not revalidate sitemap:', revalError);
        }
        
        alert('Đã tạo bài viết thành công!');
        router.push('/admin');
        router.refresh();
      } else {
        alert(`Lỗi: ${result.error || 'Không thể tạo bài viết'}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi kết nối! Vui lòng thử lại.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Thêm bài viết mới</h1>
        <ArticleForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
}

