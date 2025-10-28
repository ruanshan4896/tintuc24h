'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function TestSupabasePage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    testConnection();
  }, []);

  async function testConnection() {
    console.log('Testing Supabase connection...');
    
    try {
      // Test 1: Get all articles (no filter)
      const { data: allArticles, error: allError } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('All articles:', allArticles);
      console.log('All error:', allError);

      if (allError) {
        setError(`Error fetching articles: ${allError.message}`);
        setLoading(false);
        return;
      }

      setArticles(allArticles || []);

      // Test 2: Get only published
      const { data: publishedArticles, error: pubError } = await supabase
        .from('articles')
        .select('*')
        .eq('published', true);

      console.log('Published articles:', publishedArticles);
      console.log('Published error:', pubError);

      setLoading(false);
    } catch (err) {
      console.error('Exception:', err);
      setError(`Exception: ${err}`);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Testing Supabase connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          🔍 Supabase Connection Test
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Connection Status</h2>
          <div className="space-y-2">
            <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
            <p><strong>Anon Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</p>
            <p><strong>Total Articles:</strong> {articles.length}</p>
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <p className="font-bold">Không có bài viết nào trong database!</p>
            <p className="mt-2">Vào Supabase SQL Editor và chạy file <code>supabase/schema.sql</code></p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Published</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {articles.map((article) => (
                  <tr key={article.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {article.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {article.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {article.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        article.published 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {article.published ? 'YES ✅' : 'NO ❌'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <a 
                        href={`/articles/${article.slug}`}
                        target="_blank"
                        className="text-blue-600 hover:underline"
                      >
                        /articles/{article.slug}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">Hướng dẫn fix:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Nếu không có bài viết: Chạy <code>supabase/schema.sql</code> trong SQL Editor</li>
            <li>Nếu bài viết có <code>published = NO</code>: 
              <code className="block mt-1 bg-blue-100 p-2 rounded">
                UPDATE articles SET published = true WHERE slug = 'your-slug';
              </code>
            </li>
            <li>Sau đó thử click vào URL ở cột cuối</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

