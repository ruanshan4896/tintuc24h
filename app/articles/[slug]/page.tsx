import { getArticles } from '@/lib/api/articles';
import { getArticleBySlugServer, getArticlesServer } from '@/lib/api/articles-server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { Metadata } from 'next';

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateStaticParams() {
  try {
    const articles = await getArticlesServer(true);
    return articles.map((article) => ({
      slug: article.slug,
    }));
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
    return [];
  }
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const article = await getArticleBySlugServer(slug);

    if (!article) {
      return {
        title: 'Không tìm thấy bài viết',
      };
    }

    return {
      title: article.title,
      description: article.description,
      keywords: article.tags.join(', '),
      authors: [{ name: article.author }],
      openGraph: {
        title: article.title,
        description: article.description,
        type: 'article',
        publishedTime: article.created_at,
        modifiedTime: article.updated_at,
        authors: [article.author],
        images: article.image_url ? [
          {
            url: article.image_url,
            width: 1200,
            height: 630,
            alt: article.title,
          },
        ] : [],
        tags: article.tags,
      },
      twitter: {
        card: 'summary_large_image',
        title: article.title,
        description: article.description,
        images: article.image_url ? [article.image_url] : [],
      },
    };
  } catch (error) {
    console.error('Error in generateMetadata:', error);
    return {
      title: 'Lỗi tải bài viết',
    };
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  console.log('ArticlePage - Slug:', slug);
  
  let article;
  try {
    article = await getArticleBySlugServer(slug);
    console.log('ArticlePage - Article found:', article ? 'YES' : 'NO');
  } catch (error) {
    console.error('ArticlePage - Error:', error);
    notFound();
  }

  if (!article) {
    console.log('ArticlePage - Article is null, showing 404');
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.description,
    image: article.image_url,
    datePublished: article.created_at,
    dateModified: article.updated_at,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'TinTức',
      logo: {
        '@type': 'ImageObject',
        url: '/logo.png',
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <article className="bg-white">
        {/* Breadcrumb */}
        <div className="bg-gray-50 border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
              <span>/</span>
              <Link href={`/category/${article.category.toLowerCase()}`} className="hover:text-blue-600">
                {article.category}
              </Link>
              <span>/</span>
              <span className="text-gray-900">{article.title}</span>
            </nav>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Article Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-4 py-1 bg-blue-100 text-blue-600 text-sm font-semibold rounded-full">
                {article.category}
              </span>
              <span className="text-gray-500 text-sm">{article.views} lượt xem</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>

            <p className="text-xl text-gray-600 mb-6">
              {article.description}
            </p>

            <div className="flex items-center justify-between text-gray-600 border-t border-b py-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  {article.author[0]}
                </div>
                <div>
                  <p className="font-semibold">{article.author}</p>
                  <time dateTime={article.created_at} className="text-sm text-gray-500">
                    {format(new Date(article.created_at), 'dd MMMM yyyy, HH:mm', { locale: vi })}
                  </time>
                </div>
              </div>
            </div>
          </header>

          {/* Featured Image - DISABLED */}
          {/* {article.image_url && (
            <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden">
              <Image
                src={article.image_url}
                alt={article.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 896px"
              />
            </div>
          )} */}

          {/* Article Content */}
          <div className="prose prose-lg prose-slate max-w-none mb-8 
            prose-headings:text-gray-900 dark:prose-headings:text-gray-100
            prose-p:text-gray-800 dark:prose-p:text-gray-200
            prose-strong:text-gray-900 dark:prose-strong:text-white
            prose-a:text-blue-600 dark:prose-a:text-blue-400
            prose-code:text-gray-900 dark:prose-code:text-gray-100
            prose-pre:bg-gray-800 dark:prose-pre:bg-gray-900
            prose-li:text-gray-800 dark:prose-li:text-gray-200">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {article.content}
            </ReactMarkdown>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="border-t pt-6 mb-8">
              <h3 className="text-lg font-semibold mb-3">Tags:</h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Share Section */}
          <div className="border-t border-b py-6 mb-8">
            <p className="text-lg font-semibold mb-3">Chia sẻ bài viết:</p>
            <div className="flex gap-3">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Facebook
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(article.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition"
              >
                Twitter
              </a>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              ← Quay lại trang chủ
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}

