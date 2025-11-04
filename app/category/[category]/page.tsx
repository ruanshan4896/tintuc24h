import { getArticlesByCategoryCached } from '@/lib/api/articles-cache';
import ArticleCard from '@/components/ArticleCard';
import Link from 'next/link';
import type { Metadata } from 'next';
import OptimizedImage from '@/components/OptimizedImage';
import Breadcrumb from '@/components/Breadcrumb';
import { getCardBgClasses } from '@/lib/utils/card-colors';
import { getCategoryDisplayName } from '@/lib/constants';

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
  'tin-nong': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1920&q=80', // Hot News
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
    'tin-nong': 'Tin Nóng',
  };
  
  const internalCategoryName = categoryMap[categorySlug] || categoryName;
  const categoryDisplayName = getCategoryDisplayName(internalCategoryName);
  const articles = await getArticlesByCategoryCached(internalCategoryName, true);
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
        <OptimizedImage
          src={backgroundImage}
          alt={categoryDisplayName}
          fill
          priority
          quality={85}
          className="object-cover"
          sizes="100vw"
          objectFit="cover"
          loading="eager"
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
        {/* Masonry Layout */}
        {articles.length > 0 ? (
          <div className="masonry-container">
            {articles.map((article, idx) => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.slug}`}
                    className="group block masonry-item"
                  >
                    <article className={`${getCardBgClasses(article.id)} border border-gray-200/50 rounded-xl overflow-hidden hover:shadow-xl hover:border-blue-300/50 hover:-translate-y-1 transition-all duration-300 shadow-md`}>
                      {article.image_url && (
                        <div className={`relative overflow-hidden ${
                          idx % 6 === 0 ? 'h-64' : idx % 3 === 0 ? 'h-56' : 'h-48'
                        }`}>
                          <OptimizedImage
                            src={article.image_url}
                            alt={article.title}
                            fill
                            objectFit="cover"
                            loading={idx < 3 ? "eager" : "lazy"}
                            priority={idx < 3}
                            quality={80}
                            className="object-cover transition-opacity duration-300"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded">
                            {getCategoryDisplayName(article.category)}
                          </span>
                          <span className="text-xs text-gray-500">{article.views} lượt xem</span>
                        </div>
                        <h3 className={`font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 ${
                          idx % 6 === 0 ? 'text-lg' : 'text-base'
                        }`}>
                          {article.title}
                        </h3>
                        {article.description && (
                          <p className={`text-sm text-gray-600 ${
                            idx % 6 === 0 ? 'line-clamp-3' : 'line-clamp-2'
                          }`}>
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

