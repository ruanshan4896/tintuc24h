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

  // Featured article (most viewed)
  const featuredArticle = [...articles].sort((a, b) => b.views - a.views)[0];

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen" suppressHydrationWarning>
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
        {/* Featured Article - Modern Card */}
        {featuredArticle && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full text-sm font-bold shadow-lg">
                <TrendingUp className="w-4 h-4" />
                HOT NHẤT
              </div>
              <div className="h-0.5 flex-1 bg-gradient-to-r from-orange-500 to-transparent"></div>
            </div>
            
            <Link href={`/articles/${featuredArticle.slug}`}>
              <div className="group relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
                <div className="grid md:grid-cols-2 gap-0">
                  {/* Image */}
                  {featuredArticle.image_url && (
                    <div className="relative h-56 md:h-80 overflow-hidden">
                      <Image
                        src={featuredArticle.image_url}
                        alt={featuredArticle.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        priority
                        fetchPriority="high"
                        quality={75}
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="p-8 md:p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold rounded-full">
                        {featuredArticle.category}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {featuredArticle.views} lượt xem
                      </span>
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                      {featuredArticle.title}
                    </h2>
                    
                    <p className="text-gray-600 text-lg mb-6 line-clamp-3 leading-relaxed">
                      {featuredArticle.description}
                    </p>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {featuredArticle.author[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{featuredArticle.author}</p>
                        <p className="text-sm text-gray-500">Tác giả</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Category Sliders */}
        {CATEGORIES.map((category) => {
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
