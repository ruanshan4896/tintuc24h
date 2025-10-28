import { getArticlesByCategory } from '@/lib/api/articles';
import ArticleCard from '@/components/ArticleCard';
import Link from 'next/link';
import type { Metadata } from 'next';

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const categoryName = category.replace(/-/g, ' ');
  
  return {
    title: `${categoryName} - TinTức`,
    description: `Tất cả bài viết về ${categoryName}`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const categoryName = categorySlug.replace(/-/g, ' ');
  
  // Map slug back to original category name
  const categoryMap: { [key: string]: string } = {
    'cong-nghe': 'Công nghệ',
    'the-thao': 'Thể thao',
    'suc-khoe': 'Sức khỏe',
    'o-to': 'Ô tô',
    'giai-tri': 'Giải trí',
  };
  
  const categoryDisplayName = categoryMap[categorySlug] || categoryName;
  const articles = await getArticlesByCategory(categoryDisplayName, true);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {categoryDisplayName}
          </h1>
          <p className="text-xl text-blue-100">
            {articles.length} bài viết
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
          <span>/</span>
          <span className="text-gray-900">{categoryDisplayName}</span>
        </nav>

        {/* Articles */}
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Chưa có bài viết nào trong chủ đề này.</p>
            <Link
              href="/"
              className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Quay lại trang chủ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

