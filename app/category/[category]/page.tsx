import { getArticlesByCategory } from '@/lib/api/articles';
import ArticleCard from '@/components/ArticleCard';
import Link from 'next/link';
import type { Metadata } from 'next';
import Image from 'next/image';
import Breadcrumb from '@/components/Breadcrumb';

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

// Category background images
const categoryBackgrounds: { [key: string]: string } = {
  'cong-nghe': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80', // Technology
  'the-thao': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1920&q=80', // Sports
  'suc-khoe': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1920&q=80', // Health
  'o-to': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=80', // Cars
  'giai-tri': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1920&q=80', // Entertainment
  'game': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&q=80', // Gaming
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const categoryName = category.replace(/-/g, ' ');
  
  return {
    title: `${categoryName} - TinTức`,
    description: `Tất cả bài viết về ${categoryName}`,
    alternates: {
      canonical: `/category/${category}`,
    },
    openGraph: {
      url: `/category/${category}`,
    },
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
    'game': 'Game',
  };
  
  const categoryDisplayName = categoryMap[categorySlug] || categoryName;
  const articles = await getArticlesByCategory(categoryDisplayName, true);
  const backgroundImage = categoryBackgrounds[categorySlug] || categoryBackgrounds['cong-nghe'];

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: categoryDisplayName },
        ]}
      />

      {/* Header with Background Image */}
      <section className="relative h-[400px] md:h-[500px] overflow-hidden">
        {/* Background Image */}
        <Image
          src={backgroundImage}
          alt={categoryDisplayName}
          fill
          priority
          quality={85}
          className="object-cover"
          sizes="100vw"
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70" />
        
        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-2xl">
              {categoryDisplayName}
            </h1>
            <p className="text-2xl md:text-3xl text-white/90 font-medium drop-shadow-lg">
              {articles.length} bài viết
            </p>
          </div>
        </div>
        
        {/* Bottom Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent" />
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Magazine Style Layout */}
        {articles.length > 0 ? (
          <>
            {/* Featured Article - First Article as Hero */}
            {articles[0] && (
              <section className="mb-12">
                <article className="group relative bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 shadow-lg">
                  <div className="grid lg:grid-cols-3 gap-0">
                    {/* Large Featured Image - Clickable */}
                    {articles[0].image_url && (
                      <Link href={`/articles/${articles[0].slug}`} className="lg:col-span-2 relative h-64 lg:h-96 overflow-hidden block">
                        <Image
                          src={articles[0].image_url}
                          alt={articles[0].title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          priority
                          quality={75}
                          sizes="(max-width: 1024px) 100vw, 66vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                        
                        {/* Overlay Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 text-white">
                          <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded mb-3">
                            {articles[0].category}
                          </span>
                          <h2 className="text-2xl lg:text-4xl font-bold mb-3 leading-tight line-clamp-3">
                            {articles[0].title}
                          </h2>
                          <p className="text-sm lg:text-base text-gray-200 line-clamp-2 mb-2">
                            {articles[0].description}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-300">
                            <span>{articles[0].author}</span>
                            <span>•</span>
                            <span>{articles[0].views} lượt xem</span>
                          </div>
                        </div>
                      </Link>
                    )}
                    
                    {/* Sidebar - Latest in Category */}
                    <div className="lg:col-span-1 p-4 lg:p-6 bg-gray-50 border-l border-gray-200">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">MỚI NHẤT</h3>
                      <div className="space-y-4">
                        {articles.slice(1, 5).map((article) => (
                          <Link
                            key={article.id}
                            href={`/articles/${article.slug}`}
                            className="group/article block hover:bg-white rounded-lg p-2 transition-colors"
                          >
                            <div className="flex gap-3">
                              {article.image_url && (
                                <div className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden">
                                  <Image
                                    src={article.image_url}
                                    alt={article.title}
                                    fill
                                    className="object-cover group-hover/article:scale-105 transition-transform"
                                    sizes="80px"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-semibold text-gray-900 group-hover/article:text-blue-600 transition-colors line-clamp-2 mb-1">
                                  {article.title}
                                </h4>
                                <span className="text-xs text-gray-500">{article.category}</span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              </section>
            )}

            {/* Magazine Grid Layout - Remaining Articles */}
            {articles.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.slice(1).map((article, idx) => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.slug}`}
                    className="group block"
                  >
                    <article className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl overflow-hidden hover:shadow-xl hover:border-blue-300/50 hover:-translate-y-1 transition-all duration-300 h-full shadow-md">
                      {article.image_url && (
                        <div className={`relative overflow-hidden ${
                          idx % 5 === 0 ? 'h-64' : 'h-48'
                        }`}>
                          <Image
                            src={article.image_url}
                            alt={article.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
                        <h3 className={`font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 ${
                          idx % 5 === 0 ? 'text-lg' : 'text-base'
                        }`}>
                          {article.title}
                        </h3>
                        {article.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {article.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                          <span>{article.author}</span>
                          <span>•</span>
                          <time dateTime={article.created_at}>
                            {new Date(article.created_at).toLocaleDateString('vi-VN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </time>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </>
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

