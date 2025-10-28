import { getArticles, getCategories } from '@/lib/api/articles';
import ArticleCard from '@/components/ArticleCard';
import Link from 'next/link';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function HomePage() {
  const articles = await getArticles(true);
  const categories = await getCategories();

  const featuredArticle = articles[0];
  const otherArticles = articles.slice(1);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Chào mừng đến với TinTức
          </h1>
          <p className="text-xl md:text-2xl text-blue-100">
            Cập nhật tin tức công nghệ, SEO và nhiều chủ đề khác
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories */}
        {categories.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Chủ đề</h2>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/category/${category.toLowerCase().replace(/\s+/g, '-')}`}
                  className="px-6 py-3 bg-white rounded-lg shadow hover:shadow-md transition text-gray-700 hover:text-blue-600"
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Featured Article */}
        {featuredArticle && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Bài viết nổi bật</h2>
            <Link href={`/articles/${featuredArticle.slug}`}>
              <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                <div className="md:flex">
                  {featuredArticle.image_url && (
                    <div className="md:w-1/2 h-64 md:h-auto relative">
                      <img
                        src={featuredArticle.image_url}
                        alt={featuredArticle.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-8 md:w-1/2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-600 text-sm font-semibold rounded-full">
                      {featuredArticle.category}
                    </span>
                    <h3 className="text-3xl font-bold mt-4 mb-4 hover:text-blue-600 transition">
                      {featuredArticle.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-4">
                      {featuredArticle.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{featuredArticle.author}</span>
                      <span>{featuredArticle.views} lượt xem</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Other Articles */}
        {otherArticles.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Bài viết mới nhất</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {otherArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        )}

        {articles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Chưa có bài viết nào.</p>
            <Link
              href="/admin"
              className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Thêm bài viết đầu tiên
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
