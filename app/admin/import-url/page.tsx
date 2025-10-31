'use client';

import { useState } from 'react';
import { Globe, Download, Check, X, Loader2, Sparkles } from 'lucide-react';
import { CATEGORIES } from '@/lib/constants';

interface ImportResult {
  success: boolean;
  article?: {
    title: string;
    slug: string;
    description: string;
    content: string;
    image_url: string | null;
    category: string;
    author: string;
    tags: string[];
  };
  errors: string[];
  message?: string;
}

export default function ImportUrlPage() {
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Công nghệ');
  const [scrapeFullContent, setScrapeFullContent] = useState(true);
  const [aiRewrite, setAiRewrite] = useState(false);
  const [aiProvider, setAiProvider] = useState<'google' | 'openai'>('google');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<ImportResult['article'] | null>(null);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      alert('Vui lòng nhập URL!');
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      alert('URL không hợp lệ!');
      return;
    }

    setLoading(true);
    setResult(null);
    setPreviewData(null);

    try {
      const res = await fetch('/api/admin/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          category,
          scrapeFullContent,
          aiRewrite,
          aiProvider,
          preview: true, // Chỉ preview, chưa lưu
        }),
      });

      const data: ImportResult = await res.json();
      
      if (res.ok && data.article) {
        setPreviewData(data.article);
        setResult(data);
      } else {
        setResult(data);
        alert(`Lỗi: ${data.errors?.join(', ') || data.message || 'Không thể import URL'}`);
      }
    } catch (error) {
      console.error('Error importing URL:', error);
      alert('Lỗi kết nối! Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveArticle = async () => {
    if (!previewData) return;

    setLoading(true);

    try {
      const res = await fetch('/api/admin/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          category: previewData.category,
          scrapeFullContent,
          aiRewrite,
          aiProvider,
          preview: false, // Lưu vào database
          article: previewData, // Gửi lại data đã preview
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert('✅ Đã tạo bài viết thành công!');
        // Reset form
        setUrl('');
        setPreviewData(null);
        setResult(null);
      } else {
        alert(`Lỗi: ${data.errors?.join(', ') || data.message || 'Không thể lưu bài viết'}`);
      }
    } catch (error) {
      console.error('Error saving article:', error);
      alert('Lỗi kết nối! Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Globe className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Import từ URL</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleImport} className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="space-y-6">
            {/* URL Input */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                URL Bài Viết <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                placeholder="https://vnexpress.net/article-slug..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <p className="text-sm text-gray-500 mt-1">
                Nhập URL bài viết bạn muốn import (hỗ trợ: VnExpress, Thanh Niên, Tuổi Trẻ, Zing News, Dân Trí...)
              </p>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Danh Mục <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Options */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900">Tùy Chọn</h3>

              {/* Scrape Full Content */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="scrapeFullContent"
                  checked={scrapeFullContent}
                  onChange={(e) => setScrapeFullContent(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={loading}
                />
                <label htmlFor="scrapeFullContent" className="ml-2 text-sm font-medium text-gray-700">
                  Scrape toàn bộ nội dung (không chỉ excerpt)
                </label>
              </div>

              {/* AI Rewrite */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="aiRewrite"
                  checked={aiRewrite}
                  onChange={(e) => setAiRewrite(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={loading}
                />
                <label htmlFor="aiRewrite" className="ml-2 text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Viết lại nội dung bằng AI
                </label>
              </div>

              {/* AI Provider (only show if AI Rewrite is enabled) */}
              {aiRewrite && (
                <div className="ml-6 space-y-2">
                  <p className="text-sm text-gray-600">Chọn AI Provider:</p>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="aiProvider"
                        value="google"
                        checked={aiProvider === 'google'}
                        onChange={() => setAiProvider('google')}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        disabled={loading}
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Google AI (Gemini) - <span className="text-green-600 font-semibold">Miễn phí</span>
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="aiProvider"
                        value="openai"
                        checked={aiProvider === 'openai'}
                        onChange={() => setAiProvider('openai')}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        disabled={loading}
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        OpenAI (GPT-4) - <span className="text-orange-600 font-semibold">Trả phí</span>
                      </span>
                    </label>
                  </div>
                  {aiProvider === 'google' && (
                    <p className="text-xs text-gray-500 ml-6">
                      💡 Google AI sử dụng Gemini 2.0 Flash Lite, miễn phí nhưng có quota giới hạn
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang import...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Import & Preview
                </>
              )}
            </button>
          </div>
        </form>

        {/* Preview Section */}
        {previewData && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Check className="w-6 h-6 text-green-500" />
                Preview Bài Viết
              </h2>
              <button
                onClick={() => {
                  setPreviewData(null);
                  setResult(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                <p className="text-lg font-semibold text-gray-900">{previewData.title}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <p className="text-sm text-gray-600 font-mono">{previewData.slug}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <p className="text-sm text-gray-700">{previewData.description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  {previewData.category}
                </span>
              </div>

              {previewData.image_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh</label>
                  <img
                    src={previewData.image_url}
                    alt={previewData.title}
                    className="max-w-full h-auto rounded-lg border border-gray-300"
                  />
                </div>
              )}

              {previewData.tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {previewData.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung (Markdown)</label>
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                    {previewData.content.substring(0, 1000)}
                    {previewData.content.length > 1000 && '...'}
                  </pre>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Độ dài: {previewData.content.length} ký tự
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                onClick={handleSaveArticle}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Lưu Bài Viết
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setPreviewData(null);
                  setResult(null);
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {result && !result.success && result.errors && result.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-red-900 mb-2">❌ Lỗi</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
              {result.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

