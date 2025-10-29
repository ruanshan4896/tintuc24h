import { getArticlesByCategory } from '@/lib/api/articles';
import ArticleCard from '@/components/ArticleCard';
import Link from 'next/link';
import type { Metadata } from 'next';
import Image from 'next/image';

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
};

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
  const backgroundImage = categoryBackgrounds[categorySlug] || categoryBackgrounds['cong-nghe'];

  return (
    <div className="bg-gray-50 min-h-screen">
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

