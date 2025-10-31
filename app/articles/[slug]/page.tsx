import { getArticles, getRelatedArticles } from '@/lib/api/articles';
import { getArticleBySlugServer, getArticlesServer } from '@/lib/api/articles-server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { Metadata } from 'next';
import RelatedArticles from '@/components/RelatedArticles';
import Breadcrumb from '@/components/Breadcrumb';
import { getCategorySlug, toSlug } from '@/lib/utils/slug';

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
      alternates: {
        canonical: `/articles/${slug}`,
      },
      openGraph: {
        title: article.title,
        description: article.description,
        type: 'article',
        publishedTime: article.created_at,
        modifiedTime: article.updated_at,
        authors: [article.author],
        url: `/articles/${slug}`,
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

  // Fetch related articles
  const relatedArticles = await getRelatedArticles(
    article.id,
    article.category,
    article.tags || [],
    4
  );

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
      
      <article className="bg-transparent">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: article.category, href: `/category/${getCategorySlug(article.category)}` },
            { label: article.title },
          ]}
        />

        {/* Main Content with Sidebar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8 items-start">
            {/* Main Article Content */}
            <div className="flex-1 max-w-4xl">
              {/* Article Header */}
              <header className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-4 py-1 bg-blue-100 text-blue-600 text-sm font-semibold rounded-full">
                    {article.category}
                  </span>
                  <span className="text-gray-500 text-sm">{article.views} lượt xem</span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
                  {article.title}
                </h1>

                <p className="text-xl md:text-2xl text-gray-600 mb-6 leading-relaxed">
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

              {/* Article Content */}
              <div className="prose prose-lg prose-slate max-w-none mb-8 
                prose-headings:text-gray-900 dark:prose-headings:text-gray-100
                prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-p:leading-relaxed
                prose-strong:text-gray-900 dark:prose-strong:text-white
                prose-a:text-blue-600 dark:prose-a:text-blue-400
                prose-code:text-gray-900 dark:prose-code:text-gray-100
                prose-pre:bg-gray-800 dark:prose-pre:bg-gray-900
                prose-li:text-gray-800 dark:prose-li:text-gray-200">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ node, href, children, ...props }) => (
                      <Link 
                        href={href || '#'} 
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline transition"
                        {...props}
                      >
                        {children}
                      </Link>
                    ),
                    img: ({ node, src, alt, ...props }) => (
                      src && typeof src === 'string' ? (
                        <Image
                          src={src}
                          alt={alt || ''}
                          width={800}
                          height={450}
                          className="rounded-lg my-6 w-full h-auto"
                        />
                      ) : null
                    ),
                  }}
                >
                  {article.content}
                </ReactMarkdown>
              </div>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="border-t pt-6 mb-8">
                  <h3 className="text-lg font-semibold mb-3">Tags:</h3>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/tag/${toSlug(tag)}`}
                        className="px-4 py-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition font-medium"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Section */}
              <div className="border-t border-b py-6 mb-8">
                <p className="text-lg font-semibold mb-3">Chia sẻ bài viết:</p>
                <div className="flex gap-3">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${typeof window !== 'undefined' ? window.location.href : ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Facebook
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${typeof window !== 'undefined' ? window.location.href : ''}&text=${encodeURIComponent(article.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition"
                  >
                    Twitter
                  </a>
                </div>
              </div>

              {/* Back to Home */}
              <div className="text-center mt-12">
                <Link
                  href="/"
                  className="inline-block px-8 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  ← Quay lại trang chủ
                </Link>
              </div>

              {/* Mobile Related Articles */}
              <div className="lg:hidden mt-12">
                <RelatedArticles articles={relatedArticles} />
              </div>
            </div>

            {/* Fixed Sidebar - Related Articles (Desktop Only) */}
            <aside className="hidden lg:block w-80 flex-shrink-0 sticky top-24 self-start">
              <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                  📰 Bài viết liên quan
                </h2>
                
                <div className="space-y-4">
                  {relatedArticles.map((relatedArticle) => (
                    <Link
                      key={relatedArticle.id}
                      href={`/articles/${relatedArticle.slug}`}
                      className="group block hover:bg-gray-50 rounded-lg p-3 transition-colors"
                    >
                      {relatedArticle.image_url && (
                        <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden">
                          <Image
                            src={relatedArticle.image_url}
                            alt={relatedArticle.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 1024px) 0vw, 320px"
                          />
                        </div>
                      )}
                      
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                        {relatedArticle.title}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                          {relatedArticle.category}
                        </span>
                        <time dateTime={relatedArticle.created_at}>
                          {format(new Date(relatedArticle.created_at), 'dd MMM', { locale: vi })}
                        </time>
                      </div>
                    </Link>
                  ))}
                </div>

                {relatedArticles.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Chưa có bài viết liên quan
                  </p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </article>
    </>
  );
}

