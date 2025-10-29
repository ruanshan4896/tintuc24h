'use client';

import { useState, useEffect } from 'react';
import { Rss, Plus, Trash2, RefreshCw, Check, X, Loader2 } from 'lucide-react';
import type { RssFeed, CreateRssFeedInput, RssImportResult } from '@/lib/types/rss';

export default function RssManagementPage() {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<CreateRssFeedInput>({
    name: '',
    url: '',
    category: 'Công nghệ',
    active: true,
  });
  const [fetchingFeedId, setFetchingFeedId] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<RssImportResult | null>(null);
  const [scrapeFullContent, setScrapeFullContent] = useState(false);

  const categories = ['Công nghệ', 'Thể thao', 'Sức khỏe', 'Ô tô', 'Giải trí'];

  useEffect(() => {
    fetchFeeds();
  }, []);

  const fetchFeeds = async () => {
    try {
      const res = await fetch('/api/admin/rss');
      const data = await res.json();
      setFeeds(data.feeds || []);
    } catch (error) {
      console.error('Error fetching feeds:', error);
      alert('Không thể tải danh sách RSS feeds');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('Submitting RSS feed:', formData);
      
      const res = await fetch('/api/admin/rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log('Response:', data);

      if (!res.ok) {
        // Show detailed error message
        const errorMsg = data.error || 'Failed to add feed';
        const detailsMsg = data.details ? `\nChi tiết: ${data.details}` : '';
        const codeMsg = data.code ? `\nMã lỗi: ${data.code}` : '';
        throw new Error(errorMsg + detailsMsg + codeMsg);
      }

      setFormData({ name: '', url: '', category: 'Công nghệ', active: true });
      setShowAddForm(false);
      fetchFeeds();
      alert('✅ Đã thêm RSS feed thành công!');
    } catch (error: any) {
      console.error('Error adding feed:', error);
      alert('❌ Lỗi: ' + (error.message || 'Không thể thêm RSS feed'));
    }
  };

  const handleDeleteFeed = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa RSS feed "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/rss?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete feed');

      fetchFeeds();
      alert('Đã xóa RSS feed!');
    } catch (error) {
      console.error('Error deleting feed:', error);
      alert('Không thể xóa RSS feed');
    }
  };

  const handleFetchFeed = async (feedId: string) => {
    setFetchingFeedId(feedId);
    setImportResult(null);

    try {
      const res = await fetch('/api/admin/rss/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          feedId,
          scrapeFullContent, 
        }),
      });

      const result: RssImportResult = await res.json();
      setImportResult(result);
      
      if (result.success) {
        fetchFeeds(); // Refresh to update last_fetched
      }
    } catch (error) {
      console.error('Error fetching RSS:', error);
      alert('Không thể fetch RSS feed');
    } finally {
      setFetchingFeedId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Rss className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">RSS Feeds</h1>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Thêm RSS Feed
        </button>
      </div>

      {/* Add Feed Form */}
      {showAddForm && (
        <div className="bg-white border rounded-lg p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Thêm RSS Feed Mới</h2>
          <form onSubmit={handleAddFeed} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tên Feed</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: VnExpress - Công nghệ"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">URL RSS</label>
              <input
                type="url"
                required
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com/rss"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Chuyên mục</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="active" className="text-sm font-medium">Kích hoạt ngay</label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Thêm Feed
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <div className={`border rounded-lg p-6 mb-8 ${importResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <h3 className="text-lg font-bold mb-3">
            {importResult.success ? '✅ Import thành công!' : '❌ Import thất bại'}
          </h3>
          <div className="space-y-2 text-sm">
            <p><strong>Feed:</strong> {importResult.feedName}</p>
            <p><strong>Tổng số items:</strong> {importResult.totalItems}</p>
            <p><strong>Bài viết mới:</strong> {importResult.newArticles}</p>
            <p><strong>Đã bỏ qua:</strong> {importResult.skippedItems}</p>
            {importResult.errors.length > 0 && (
              <div className="mt-3">
                <strong>Lỗi:</strong>
                <ul className="list-disc list-inside mt-1 text-red-600">
                  {importResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button
            onClick={() => setImportResult(null)}
            className="mt-4 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Scrape Options */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
              🕷️ Web Scraping Options
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="scrapeFullContent"
                checked={scrapeFullContent}
                onChange={(e) => setScrapeFullContent(e.target.checked)}
                className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <label htmlFor="scrapeFullContent" className="text-sm text-gray-700 cursor-pointer">
                <strong>Lấy toàn bộ nội dung bài viết</strong> (Scrape full article content from original URL)
              </label>
            </div>
            <p className="text-xs text-gray-600 mt-2 ml-8">
              ⚡ Khi bật: Tự động crawl full content từ URL gốc (chậm hơn nhưng nội dung đầy đủ)
              <br />
              💡 Khi tắt: Chỉ lấy excerpt từ RSS feed (nhanh nhưng nội dung ngắn)
            </p>
            {scrapeFullContent && (
              <div className="ml-8 mt-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                ⚠️ <strong>Lưu ý:</strong> Web scraping sẽ chậm hơn (15-30s/bài). Chỉ lấy 10 bài/lần để tránh timeout.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feeds List */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Tên</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Chuyên mục</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Trạng thái</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Lần fetch cuối</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {feeds.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Chưa có RSS feed nào. Thêm feed mới để bắt đầu!
                </td>
              </tr>
            ) : (
              feeds.map((feed) => (
                <tr key={feed.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{feed.name}</p>
                      <p className="text-sm text-gray-500 truncate max-w-md">{feed.url}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                      {feed.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {feed.active ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <Check className="w-4 h-4" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-400">
                        <X className="w-4 h-4" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {feed.last_fetched
                      ? new Date(feed.last_fetched).toLocaleString('vi-VN')
                      : 'Chưa fetch'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleFetchFeed(feed.id)}
                        disabled={fetchingFeedId === feed.id || !feed.active}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Fetch bài viết"
                      >
                        {fetchingFeedId === feed.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteFeed(feed.id, feed.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Xóa feed"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Help Text */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Hướng dẫn sử dụng</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Click <strong>Fetch</strong> để lấy bài viết mới từ RSS feed</li>
          <li>• Bài viết sẽ được import với trạng thái <strong>Draft</strong> (chưa publish)</li>
          <li>• Vào trang <strong>Quản lý bài viết</strong> để review và publish</li>
          <li>• Hệ thống tự động tránh duplicate bài viết</li>
          <li>• Mỗi lần fetch giới hạn 10 bài mới nhất</li>
        </ul>
      </div>
    </div>
  );
}

