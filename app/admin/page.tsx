'use client';

import { useEffect, useState } from 'react';
import { getArticlesForAdmin, deleteArticle } from '@/lib/api/articles';
import { Article } from '@/lib/types/article';
import Link from 'next/link';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function AdminPage() {
  const [articles, setArticles] = useState<Partial<Article>[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    loadArticles();
  }, []);

  // Clear selection when filter changes
  useEffect(() => {
    setSelectedArticles(new Set());
  }, [filter]);

  async function loadArticles() {
    setLoading(true);
    try {
      // Use server-side API instead of direct client query (bypasses RLS)
      const response = await fetch('/api/admin/articles?limit=500');
      if (response.ok) {
        const result = await response.json();
        setArticles(result.articles || []);
      } else {
        const error = await response.json();
        console.error('Error loading articles:', error);
        alert(`Lỗi: ${error.error || 'Không thể tải danh sách bài viết'}`);
        setArticles([]);
      }
    } catch (error: any) {
      console.error('Exception loading articles:', error);
      alert('Lỗi kết nối! Vui lòng thử lại.');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (confirm(`Bạn có chắc muốn xóa bài viết "${title}"?`)) {
      try {
        const response = await fetch(`/api/admin/articles?id=${id}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Revalidate sitemap after deleting article
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
          
          alert('Đã xóa bài viết thành công!');
          loadArticles();
        } else {
          alert(`Lỗi: ${result.error || 'Không thể xóa bài viết'}`);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Lỗi kết nối! Vui lòng thử lại.');
      }
    }
  }

  const filteredArticles = articles.filter((article) => {
    if (filter === 'published') return article.published;
    if (filter === 'draft') return !article.published;
    return true;
  });

  // Bulk selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(filteredArticles.map(a => a.id).filter((id): id is string => id !== undefined));
      setSelectedArticles(allIds);
    } else {
      setSelectedArticles(new Set());
    }
  };

  const handleSelectArticle = (id: string) => {
    const newSelected = new Set(selectedArticles);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedArticles(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedArticles.size === 0) {
      alert('Vui lòng chọn ít nhất một bài viết để xóa');
      return;
    }

    const confirmMsg = `Bạn có chắc muốn xóa ${selectedArticles.size} bài viết đã chọn?\n\nHành động này không thể hoàn tác!`;
    if (!confirm(confirmMsg)) return;

    setIsDeleting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Delete articles one by one (could be optimized with bulk API)
      for (const id of selectedArticles) {
        try {
          const response = await fetch(`/api/admin/articles?id=${id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Failed to delete article ${id}:`, error);
          failCount++;
        }
      }

      // Revalidate sitemap
      try {
        await fetch('/api/admin/revalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: '/sitemap.xml' }),
        });
      } catch (revalError) {
        console.warn('Could not revalidate sitemap:', revalError);
      }

      // Show result
      if (failCount === 0) {
        alert(`✅ Đã xóa thành công ${successCount} bài viết!`);
      } else {
        alert(`⚠️ Kết quả:\n- Thành công: ${successCount}\n- Thất bại: ${failCount}`);
      }

      // Clear selection and reload
      setSelectedArticles(new Set());
      loadArticles();
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('❌ Có lỗi xảy ra khi xóa bài viết!');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublishAllDrafts = async () => {
    const draftArticles = articles.filter(a => !a.published);
    
    if (draftArticles.length === 0) {
      alert('Không có bài viết nháp nào để xuất bản!');
      return;
    }

    const confirmMsg = `Bạn có chắc muốn xuất bản ${draftArticles.length} bài viết nháp?\n\nTất cả sẽ hiển thị công khai ngay lập tức!`;
    if (!confirm(confirmMsg)) return;

    setIsPublishing(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Publish all draft articles
      for (const article of draftArticles) {
        try {
          const response = await fetch(`/api/admin/articles?id=${article.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ published: true }),
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Failed to publish article ${article.id}:`, error);
          failCount++;
        }
      }

      // Revalidate sitemap
      try {
        await fetch('/api/admin/revalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: '/sitemap.xml' }),
        });
      } catch (revalError) {
        console.warn('Could not revalidate sitemap:', revalError);
      }

      // Show result
      if (failCount === 0) {
        alert(`✅ Đã xuất bản thành công ${successCount} bài viết!`);
      } else {
        alert(`⚠️ Kết quả:\n- Thành công: ${successCount}\n- Thất bại: ${failCount}`);
      }

      // Reload articles
      loadArticles();
    } catch (error) {
      console.error('Bulk publish error:', error);
      alert('❌ Có lỗi xảy ra khi xuất bản bài viết!');
    } finally {
      setIsPublishing(false);
    }
  };

  const isAllSelected = filteredArticles.length > 0 && selectedArticles.size === filteredArticles.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                📰 Ctrl Z
              </Link>
              <span className="text-gray-300">|</span>
              <span className="text-gray-600 font-medium">Admin Panel</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Xin chào,</p>
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Quản lý bài viết</h1>
            <div className="flex gap-3">
              <Link
                href="/admin/import-url"
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
              >
                🔗 Import từ URL
              </Link>
              <Link
                href="/admin/rss"
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold"
              >
                📡 RSS Feeds
              </Link>
              <Link
                href="/admin/new"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                + Thêm bài viết mới
              </Link>
            </div>
          </div>

        {/* Filter & Bulk Actions */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Tất cả ({articles.length})
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'published'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Đã xuất bản ({articles.filter((a) => a.published).length})
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'draft'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Bản nháp ({articles.filter((a) => !a.published).length})
            </button>
          </div>

               {/* Action Buttons */}
               <div className="flex gap-3">
                 {/* Publish All Drafts Button */}
                 {articles.filter(a => !a.published).length > 0 && (
                   <button
                     onClick={handlePublishAllDrafts}
                     disabled={isPublishing}
                     className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                   >
                     {isPublishing ? (
                       <>
                         <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                         </svg>
                         Đang xuất bản...
                       </>
                     ) : (
                       <>
                         ✅ Xuất bản {articles.filter(a => !a.published).length} bài nháp
                       </>
                     )}
                   </button>
                 )}

                 {/* Bulk Delete Button */}
                 {selectedArticles.size > 0 && (
                   <button
                     onClick={handleBulkDelete}
                     disabled={isDeleting}
                     className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                   >
                     {isDeleting ? (
                       <>
                         <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                         </svg>
                         Đang xóa...
                       </>
                     ) : (
                       <>
                         🗑️ Xóa {selectedArticles.size} bài viết
                       </>
                     )}
                   </button>
                 )}
               </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      title="Chọn tất cả"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tiêu đề
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Danh mục
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lượt xem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredArticles.map((article) => {
                  if (!article.id) return null;
                  return (
                  <tr key={article.id} className={`hover:bg-gray-50 ${selectedArticles.has(article.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedArticles.has(article.id!)}
                        onChange={() => handleSelectArticle(article.id!)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        title="Chọn bài viết này"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {article.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {article.slug}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {article.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          article.published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {article.published ? 'Đã xuất bản' : 'Bản nháp'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {article.views}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {article.created_at ? format(new Date(article.created_at), 'dd/MM/yyyy', { locale: vi }) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/articles/${article.slug}`}
                        target="_blank"
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Xem
                      </Link>
                      <Link
                        href={`/admin/edit/${article.id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Sửa
                      </Link>
                      <button
                        onClick={() => article.id && handleDelete(article.id, article.title || 'Untitled')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredArticles.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Không có bài viết nào.</p>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

