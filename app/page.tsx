import { getArticles } from '@/lib/api/articles';
import CategorySlider from '@/components/CategorySlider';
import Link from 'next/link';
import Image from 'next/image';
import { CATEGORIES } from '@/lib/constants';
import { Newspaper, TrendingUp } from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 60; // Revalidate every 60 seconds

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

// Icon mapping cho từng category
const categoryIcons: Record<string, string> = {
  'Công nghệ': '💻',
  'Thể thao': '⚽',
  'Sức khỏe': '❤️',
  'Ô tô': '🚗',
  'Giải trí': '🎬',
  'Game': '🎮',
};

// Category slug mapping
const categorySlugMap: Record<string, string> = {
  'Công nghệ': 'cong-nghe',
  'Thể thao': 'the-thao',
  'Sức khỏe': 'suc-khoe',
  'Ô tô': 'o-to',
  'Giải trí': 'giai-tri',
  'Game': 'game',
};

export default async function HomePage() {
  const articles = await getArticles(true);

  // Group articles by category
  const articlesByCategory: Record<string, typeof articles> = {};
  CATEGORIES.forEach(cat => {
    articlesByCategory[cat] = articles
      .filter(article => article.category === cat)
      .slice(0, 10); // Limit 10 articles per category
  });


  return (
    <div className="min-h-screen" suppressHydrationWarning>
      {/* Modern Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white overflow-hidden">
        {/* Simple gradient background for better performance */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" aria-hidden="true"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10 text-center">
          {/* Icons - Centered */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <Newspaper className="w-10 h-10 md:w-12 md:h-12" />
            <div className="h-10 w-1 bg-white/30"></div>
            <TrendingUp className="w-8 h-8 md:w-10 md:h-10" />
          </div>
          
          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-4 leading-tight">
            📰 Ctrl Z
          </h1>
          
          {/* Slogan */}
          <p className="text-xl md:text-2xl lg:text-3xl text-blue-100 font-semibold mb-3 leading-relaxed">
            Hoàn tác tin giả - Khôi phục sự thật
          </p>
          
          {/* Sub-description */}
          <p className="text-base md:text-lg text-blue-200 max-w-3xl mx-auto leading-relaxed mb-8">
            Tin tức minh bạch, đa chiều từ mọi lĩnh vực: Công nghệ, Thể thao, Sức khỏe, Ô tô, Giải trí, Game
          </p>
          
          {/* Quick category links - Centered */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {CATEGORIES.map((category) => (
              <Link
                key={category}
                href={`/category/${categorySlugMap[category]}`}
                className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-sm font-semibold transition-all hover:scale-105"
              >
                {categoryIcons[category]} {category}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Magazine Style Layout */}
        
        {/* Featured Articles Section */}
        {(() => {
          const featuredArticles = articles
            .sort((a, b) => b.views - a.views)
            .slice(0, 4);
          
          return featuredArticles.length > 0 ? (
            <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full text-sm font-bold shadow-lg">
                <TrendingUp className="w-4 h-4" />
                TIN NỔI BẬT
              </div>
              <div className="h-0.5 flex-1 bg-gradient-to-r from-orange-500 to-transparent"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.slug}`}
                    className="group block"
                  >
                    <article className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl overflow-hidden hover:shadow-xl hover:border-blue-300/50 hover:-translate-y-1 transition-all duration-300 shadow-md h-full">
                      {article.image_url && (
                        <div className="relative h-40 overflow-hidden">
                          <Image
                            src={article.image_url}
                            alt={article.title}
                            fill
                            className="object-cover transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded">
                            {article.category}
                          </span>
                          <span className="text-xs text-gray-500">{article.views} lượt xem</span>
                        </div>
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm">
                          {article.title}
                        </h3>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          ) : null;
        })()}

        {/* Magazine Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Left Column - Large Articles */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category Sections */}
            {CATEGORIES.slice(0, 3).map((category) => {
              const categoryArticles = articlesByCategory[category];
              if (!categoryArticles || categoryArticles.length === 0) return null;
              
              return (
                <section key={category} className="border-b border-gray-200 pb-8 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between mb-4">
                    <Link href={`/category/${categorySlugMap[category]}`} className="flex items-center gap-2 group">
                      <span className="text-2xl">{categoryIcons[category]}</span>
                      <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {category}
                      </h2>
                    </Link>
                    <Link 
                      href={`/category/${categorySlugMap[category]}`}
                      className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      Xem tất cả →
                    </Link>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {categoryArticles.slice(0, 5).map((article, idx) => (
                      <Link
                        key={article.id}
                        href={`/articles/${article.slug}`}
                        className={`group block ${
                          idx === 0 ? 'md:col-span-2' : ''
                        }`}
                      >
                        <article className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl overflow-hidden hover:shadow-xl hover:border-blue-300/50 hover:-translate-y-1 transition-all duration-300 shadow-md h-full">
                          {article.image_url && (
                            <div className={`relative overflow-hidden ${
                              idx === 0 ? 'h-64' : 'h-40'
                            }`}>
                              <Image
                                src={article.image_url}
                                alt={article.title}
                                fill
                                className="object-cover transition-transform duration-300"
                                sizes={idx === 0 ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
                              />
                            </div>
                          )}
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded">
                                {article.category}
                              </span>
                              <span className="text-xs text-gray-500">{article.views} lượt xem</span>
                            </div>
                            <h3 className={`font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 ${
                              idx === 0 ? 'text-xl' : 'text-base'
                            }`}>
                              {article.title}
                            </h3>
                            {idx === 0 && article.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                                {article.description}
                              </p>
                            )}
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Right Sidebar - Popular & Trending */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Popular Articles */}
            <section className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                📊 Đọc nhiều
              </h2>
              <div className="space-y-4">
                {articles
                  .sort((a, b) => b.views - a.views)
                  .slice(0, 5)
                  .map((article, idx) => (
                    <Link
                      key={article.id}
                      href={`/articles/${article.slug}`}
                      className="group flex gap-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                        <span className="text-xs text-gray-500">{article.category}</span>
                      </div>
                    </Link>
                  ))}
              </div>
            </section>

            {/* Recent Articles */}
            <section className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                🕐 Mới nhất
              </h2>
              <div className="space-y-4">
                {articles
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 5)
                  .map((article) => (
                    <Link
                      key={article.id}
                      href={`/articles/${article.slug}`}
                      className="group block"
                    >
                      {article.image_url && (
                        <div className="relative w-full h-32 mb-2 rounded-lg overflow-hidden">
                          <Image
                            src={article.image_url}
                            alt={article.title}
                            fill
                            className="object-cover transition-transform duration-300"
                            sizes="(max-width: 1024px) 0vw, 320px"
                          />
                        </div>
                      )}
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="px-2 py-0.5 bg-gray-100 rounded">{article.category}</span>
                      </div>
                    </Link>
                  ))}
              </div>
            </section>
          </aside>
        </div>

        {/* Remaining Category Sliders */}
        {CATEGORIES.slice(3).map((category) => {
          const categoryArticles = articlesByCategory[category];
          if (!categoryArticles || categoryArticles.length === 0) return null;
          
          return (
            <CategorySlider
              key={category}
              category={category}
              articles={categoryArticles}
              categorySlug={categorySlugMap[category]}
              icon={categoryIcons[category]}
            />
          );
        })}

        {/* Empty state */}
        {articles.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <Newspaper className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Chưa có bài viết nào</h3>
            <p className="text-gray-500 mb-6">Hãy thêm bài viết đầu tiên để bắt đầu</p>
            <Link
              href="/admin"
              className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-all hover:scale-105"
            >
              Thêm bài viết đầu tiên
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
