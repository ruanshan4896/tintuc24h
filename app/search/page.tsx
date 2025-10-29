import { searchArticlesServer } from '@/lib/api/articles-server';
import ArticleCard from '@/components/ArticleCard';
import Link from 'next/link';
import { Search } from 'lucide-react';
import type { Metadata } from 'next';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  try {
    const params = await searchParams;
    const query = params.q || '';
    
    return {
      title: query ? `Tìm kiếm: ${query} - TinTức` : 'Tìm kiếm - TinTức',
      description: query ? `Kết quả tìm kiếm cho "${query}"` : 'Tìm kiếm bài viết',
    };
  } catch (error) {
    return {
      title: 'Tìm kiếm - TinTức',
      description: 'Tìm kiếm bài viết',
    };
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  try {
    const params = await searchParams;
    const query = params.q || '';
    const articles = query ? await searchArticlesServer(query) : [];

    return (
      <div className="bg-gray-50 min-h-screen">
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-4">
              <Search className="w-10 h-10" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Kết quả tìm kiếm
              </h1>
            </div>
            <p className="text-xl text-blue-100">
              {query ? `Tìm kiếm cho: "${query}"` : 'Nhập từ khóa để tìm kiếm'}
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {!query ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">Vui lòng nhập từ khóa tìm kiếm</p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Quay lại trang chủ
              </Link>
            </div>
          ) : articles.length > 0 ? (
            <>
              <p className="text-gray-600 mb-6 text-lg">
                Tìm thấy <span className="font-semibold text-blue-600">{articles.length}</span> bài viết
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">
                Không tìm thấy bài viết nào phù hợp với "{query}"
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Quay lại trang chủ
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in SearchPage:', error);
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Có lỗi xảy ra</h1>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }
}

