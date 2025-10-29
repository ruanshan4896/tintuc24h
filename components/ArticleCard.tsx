'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/lib/types/article';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ArticleCardProps {
  article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <Link href={`/articles/${article.slug}`}>
        {article.image_url && (
          <div className="relative h-48 w-full">
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
      </Link>
      
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 bg-blue-100 text-blue-600 text-xs font-semibold rounded-full">
            {article.category}
          </span>
          <span className="text-gray-500 text-sm">
            {article.views} lượt xem
          </span>
        </div>

        <Link href={`/articles/${article.slug}`}>
          <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition">
            {article.title}
          </h2>

          <p className="text-gray-600 mb-4 line-clamp-3">
            {article.description}
          </p>
        </Link>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>{article.author}</span>
          <time dateTime={article.created_at}>
            {format(new Date(article.created_at), 'dd MMM yyyy', { locale: vi })}
          </time>
        </div>

        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Link
                key={tag}
                href={`/tag/${encodeURIComponent(tag)}`}
                className="text-xs text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

