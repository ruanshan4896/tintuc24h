import { searchArticles } from '@/lib/api/articles';
import ArticleCard from '@/components/ArticleCard';
import Link from 'next/link';

interface SearchPageProps {
  searchParams: {
    q?: string;
  };
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';
  
  return {
    title: `Tìm kiếm: ${query} - TinTức`,
    description: `Kết quả tìm kiếm cho "${query}"`,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';
  const articles = query ? await searchArticles(query) : [];

  return (
    <div className="bg-gray-50 min-h-screen">
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Kết quả tìm kiếm
          </h1>
          <p className="text-xl text-blue-100">
            {query ? `Tìm kiếm cho: "${query}"` : 'Nhập từ khóa để tìm kiếm'}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!query ? (
          <div className="text-center py-12">
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
            <p className="text-gray-600 mb-6">Tìm thấy {articles.length} bài viết</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
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
}

