import Link from 'next/link';
import { Article } from '@/lib/types/article';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

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
            className="group block bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-200"
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
    </section>
  );
}

