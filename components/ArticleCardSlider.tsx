import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/lib/types/article';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Clock, Eye } from 'lucide-react';

interface ArticleCardSliderProps {
  article: Article;
  priority?: boolean;
}

export default function ArticleCardSlider({ article, priority = false }: ArticleCardSliderProps) {
  return (
    <article className="group bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-2xl hover:border-blue-300/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full flex flex-col border border-gray-200/50" suppressHydrationWarning>
      <Link href={`/articles/${article.slug}`} className="flex flex-col h-full" prefetch={false} suppressHydrationWarning>
        {/* Image */}
        {article.image_url && (
          <div className="relative h-52 w-full overflow-hidden bg-gray-100">
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-500"
              sizes="(max-width: 768px) 300px, 350px"
              loading={priority ? 'eager' : 'lazy'}
              quality={75}
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* Category badge */}
            <div className="absolute top-3 left-3">
              <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full shadow-lg">
                {article.category}
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
            {article.title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
            {article.description}
          </p>

          {/* Meta info */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <time dateTime={article.created_at}>
                {format(new Date(article.created_at), 'dd/MM/yyyy', { locale: vi })}
              </time>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>{article.views}</span>
            </div>
          </div>

          {/* Author */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {article.author[0]}
              </div>
              <span className="text-sm text-gray-700 font-medium">{article.author}</span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

