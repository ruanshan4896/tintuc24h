import { getArticleBySlugCached, getRelatedArticlesCached } from '@/lib/api/articles-cache';
import { getArticlesServer } from '@/lib/api/articles-server';
import { notFound } from 'next/navigation';
import OptimizedImage from '@/components/OptimizedImage';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { Metadata } from 'next';
import RelatedArticles from '@/components/RelatedArticles';
import Breadcrumb from '@/components/Breadcrumb';
import { getCategorySlug, toSlug } from '@/lib/utils/slug';
import { getCardBgClasses } from '@/lib/utils/card-colors';
import { Gift } from 'lucide-react';
import { getCategoryDisplayName } from '@/lib/constants';

// Helper functions for image proxy
function needsProxy(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    return hostname.includes('.vnecdn.net') || 
           hostname.includes('.vnexpress.net') ||
           hostname === 'vnexpress.net';
  } catch {
    return false;
  }
}

function getProxyUrl(url: string): string {
  if (needsProxy(url)) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

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
    const article = await getArticleBySlugCached(slug);

    if (!article) {
      return {
        title: 'Không tìm thấy bài viết',
      };
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tintuc24h-seven.vercel.app';
    const articleUrl = `${baseUrl}/articles/${slug}`;
    
    // Enhanced meta description with keywords
    const enhancedDescription = article.description || 
      `${article.title}. Tin tức ${article.category.toLowerCase()} mới nhất từ Ctrl Z. ${article.tags.slice(0, 3).join(', ')}`;
    
    return {
      title: article.title,
      description: enhancedDescription,
      keywords: [...article.tags, article.category, 'tin tức', 'news', 'ctrl z'].join(', '),
      authors: [{ name: article.author }],
      alternates: {
        canonical: `/articles/${slug}`,
      },
      openGraph: {
        title: article.title,
        description: enhancedDescription,
        type: 'article',
        publishedTime: article.created_at,
        modifiedTime: article.updated_at,
        authors: [article.author],
        url: articleUrl,
        images: article.image_url ? [
          {
            url: needsProxy(article.image_url) ? getProxyUrl(article.image_url) : article.image_url,
            width: 1200,
            height: 630,
            alt: article.title,
          },
        ] : [],
        tags: article.tags,
        section: article.category,
      },
      twitter: {
        card: 'summary_large_image',
        title: article.title,
        description: enhancedDescription,
        images: article.image_url ? [needsProxy(article.image_url) ? getProxyUrl(article.image_url) : article.image_url] : [],
      },
      other: {
        'article:published_time': article.created_at,
        'article:modified_time': article.updated_at,
        'article:author': article.author,
        'article:section': article.category,
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
    article = await getArticleBySlugCached(slug);
    console.log('ArticlePage - Article found:', article ? 'YES' : 'NO');
  } catch (error) {
    console.error('ArticlePage - Error:', error);
    notFound();
  }

  if (!article) {
    console.log('ArticlePage - Article is null, showing 404');
    notFound();
  }

  // Fetch related articles (cached and optimized)
  const relatedArticles = await getRelatedArticlesCached(
    article.id,
    article.category,
    article.tags || [],
    4
  );

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tintuc24h-seven.vercel.app';
  const articleUrl = `${baseUrl}/articles/${article.slug}`;
  
  // Calculate word count from content (rough estimation)
  const wordCount = article.content.split(/\s+/).filter(word => word.length > 0).length;
  
  // Extract main image with proper formatting
  const images = article.image_url ? [{
    '@type': 'ImageObject',
    url: article.image_url,
    width: 1200,
    height: 630,
  }] : [];

  // Enhanced Article schema for better SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.description,
    image: images.length > 0 ? images[0].url : undefined,
    images: images.length > 0 ? images : undefined,
    datePublished: article.created_at,
    dateModified: article.updated_at,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Ctrl Z',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/og-image.jpg`,
        width: 600,
        height: 315,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    articleSection: article.category,
    keywords: article.tags.join(', '),
    articleBody: article.content,
    wordCount: wordCount,
    inLanguage: 'vi-VN',
    url: articleUrl,
    ...(article.image_url && {
      image: {
        '@type': 'ImageObject',
        url: article.image_url,
        width: 1200,
        height: 630,
      },
    }),
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
            { label: getCategoryDisplayName(article.category), href: `/category/${getCategorySlug(article.category)}` },
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
                    {getCategoryDisplayName(article.category)}
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
                    // Custom paragraph renderer - detect if paragraph contains only image
                    p: ({ node, children, ...props }: any) => {
                      // Check if this paragraph contains ONLY an image (no text)
                      if (node?.children && Array.isArray(node.children)) {
                        // Count image nodes and text nodes
                        let imageCount = 0;
                        let textCount = 0;
                        
                        node.children.forEach((child: any) => {
                          if (child?.type === 'element' && child?.tagName === 'img') {
                            imageCount++;
                          } else if (child?.type === 'text' && child?.value?.trim()) {
                            textCount++;
                          }
                        });
                        
                        // If paragraph contains only images (no text), use div instead of p
                        if (imageCount > 0 && textCount === 0) {
                          return <div className="my-6 block">{children}</div>;
                        }
                      }
                      
                      // Normal paragraph with text content
                      return <p {...props}>{children}</p>;
                    },
                    img: ({ node, src, alt, ...props }: any) => {
                      if (!src || typeof src !== 'string') return null;
                      
                      // Use inline={true} to prevent wrapper div, since paragraph renderer handles the wrapper
                      return (
                        <OptimizedImage
                          src={src}
                          alt={alt || ''}
                          width={800}
                          height={450}
                          className="rounded-lg w-full h-auto block"
                          objectFit="contain"
                          loading="lazy"
                          inline={true}
                        />
                      );
                    },
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
                      className={`group block ${getCardBgClasses(relatedArticle.id)} hover:shadow-md rounded-lg p-3 transition-all border border-gray-200/50`}
                    >
                      {relatedArticle.image_url && (
                        <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden">
                          <OptimizedImage
                            src={relatedArticle.image_url}
                            alt={relatedArticle.title}
                            fill
                            className="object-cover transition-transform duration-300"
                            sizes="(max-width: 1024px) 0vw, 320px"
                            objectFit="cover"
                            loading="lazy"
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

                {/* Advertisement Banner 1 */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <section className="bg-gradient-to-br from-blue-500 to-purple-600 border border-gray-200/50 rounded-xl p-4 shadow-lg text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_50%)]" aria-hidden="true"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Gift className="w-4 h-4" />
                        <h3 className="text-sm font-bold">Quảng cáo</h3>
                      </div>
                      <div className="w-full bg-white/10 backdrop-blur-sm rounded-lg p-2 mb-2 border border-white/20">
                        <a 
                          href="https://haudaiseo009.pages.dev/go/qh88?site=tintuc" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block w-full"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src="https://lh3.googleusercontent.com/d/12g3IJugKxAG0pt9KlYVXBOjbBVmNVR06=w1920?authuser=0" 
                            alt="Advertisement" 
                            className="w-full h-auto rounded"
                            style={{ maxWidth: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
                            referrerPolicy="no-referrer"
                            decoding="async"
                          />
                        </a>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Advertisement Banner 2 */}
                <div className="mt-4">
                  <section className="bg-gradient-to-br from-orange-500 to-pink-600 border border-gray-200/50 rounded-xl p-4 shadow-lg text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.15),transparent_50%)]" aria-hidden="true"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Gift className="w-4 h-4" />
                        <h3 className="text-sm font-bold">Ưu đãi đặc biệt</h3>
                      </div>
                      <div className="w-full bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                        <a 
                          href="https://w.mm9954.com/?inviteCode=90970249" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block w-full"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src="https://lh3.googleusercontent.com/d/1_RmlzgxTdQTm-wV41eha1ufBUu5zDMES=w1920?authuser=0" 
                            alt="Advertisement" 
                            className="w-full h-auto rounded"
                            style={{ maxWidth: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
                            referrerPolicy="no-referrer"
                            decoding="async"
                          />
                        </a>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </>
  );
}

