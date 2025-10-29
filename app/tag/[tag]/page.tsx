import { getArticlesByTagServer } from '@/lib/api/articles-server';
import ArticleCard from '@/components/ArticleCard';
import Link from 'next/link';
import { Tag } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';

interface TagPageProps {
  params: Promise<{
    tag: string;
  }>;
}

export const dynamic = 'force-dynamic';

// Tag page background image
const TAG_BACKGROUND = 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80';

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const tag = decodeURIComponent(resolvedParams.tag);
    const encodedTag = encodeURIComponent(tag);
    
    return {
      title: `Tag: ${tag} - TinTức`,
      description: `Tất cả bài viết được gắn tag "${tag}"`,
      alternates: {
        canonical: `/tag/${encodedTag}`,
      },
      openGraph: {
        url: `/tag/${encodedTag}`,
      },
    };
  } catch (error) {
    return {
      title: 'Tag - TinTức',
      description: 'Bài viết theo tag',
    };
  }
}

export default async function TagPage({ params }: TagPageProps) {
  try {
    const resolvedParams = await params;
    const tag = decodeURIComponent(resolvedParams.tag);
    const articles = await getArticlesByTagServer(tag, true);

    return (
      <div className="bg-gray-50 min-h-screen">
        {/* Header with Background Image */}
        <section className="relative h-[350px] md:h-[450px] overflow-hidden">
          {/* Background Image */}
          <Image
            src={TAG_BACKGROUND}
            alt={`Tag ${tag}`}
            fill
            priority
            quality={85}
            className="object-cover"
            sizes="100vw"
          />
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-indigo-800/75 to-purple-900/80" />
          
          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                <Tag className="w-12 h-12 md:w-16 md:h-16 text-white drop-shadow-lg" />
                <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-2xl">
                  #{tag}
                </h1>
              </div>
              <p className="text-2xl md:text-3xl text-white/90 font-medium drop-shadow-lg">
                {articles.length} bài viết
              </p>
            </div>
          </div>
          
          {/* Bottom Gradient Fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent" />
        </section>

        {/* Articles */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">
                Chưa có bài viết nào với tag này
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
    console.error('Error in TagPage:', error);
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
