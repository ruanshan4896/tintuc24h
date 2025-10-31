import Link from 'next/link';
import { Article } from '@/lib/types/article';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getCardBgClasses } from '@/lib/utils/card-colors';
import { Gift } from 'lucide-react';

interface RelatedArticlesProps {
  articles: Article[];
}

export default function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 pt-8 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        📰 Bài viết liên quan
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/articles/${article.slug}`}
            className={`group block ${getCardBgClasses(article.id)} rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-200`}
          >
            <div className="p-5">
              {/* Category badge */}
              <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded mb-3">
                {article.category}
              </span>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                {article.title}
              </h3>

              {/* Description */}
              {article.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {article.description}
                </p>
              )}

              {/* Meta info */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <time dateTime={article.created_at}>
                  {format(new Date(article.created_at), 'dd MMM, yyyy', { locale: vi })}
                </time>
                {article.views > 0 && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {article.views.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Advertisement Banners */}
      <div className="mt-8 pt-8 border-t border-gray-200 space-y-6">
        {/* Advertisement Banner 1 */}
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

        {/* Advertisement Banner 2 */}
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
    </section>
  );
}

