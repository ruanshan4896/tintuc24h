import { getArticlesByCategoryCached, getPopularTagsCached } from '@/lib/api/articles-cache';
import Link from 'next/link';
import OptimizedImage from '@/components/OptimizedImage';
import { CATEGORIES } from '@/lib/constants';
import { Newspaper, TrendingUp, Mail, Facebook, Youtube, Twitter, Tag as TagIcon, Gift } from 'lucide-react';
import type { Metadata } from 'next';
import { getCardBgClasses } from '@/lib/utils/card-colors';
import { toSlug } from '@/lib/utils/slug';

export const revalidate = 60; // Revalidate every 60 seconds

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

// Icon mapping cho từng category
const categoryIcons: Record<string, string> = {
  'Công nghệ': '💻',
  'Thể thao': '⚽',
  'Sức khỏe': '❤️',
  'Ô tô': '🚗',
  'Giải trí': '🎬',
  'Game': '🎮',
};

// Category slug mapping
const categorySlugMap: Record<string, string> = {
  'Công nghệ': 'cong-nghe',
  'Thể thao': 'the-thao',
  'Sức khỏe': 'suc-khoe',
  'Ô tô': 'o-to',
  'Giải trí': 'giai-tri',
  'Game': 'game',
};

export default async function HomePage() {
  // Fetch articles by category in parallel (much more efficient than fetch all then filter)
  const categoryPromises = CATEGORIES.map(cat => 
    getArticlesByCategoryCached(cat, true)
  );
  
  const categoryResults = await Promise.all(categoryPromises);
  
  // Group articles by category
  const articlesByCategory: Record<string, typeof categoryResults[0]> = {};
  CATEGORIES.forEach((cat, index) => {
    articlesByCategory[cat] = categoryResults[index].slice(0, 10); // Limit 10 per category
  });

  // Get popular tags (cached, separate optimized query)
  const popularTags = await getPopularTagsCached(10);

  // Flatten all articles for sidebar sections (popular/recent)
  const allArticles = Object.values(articlesByCategory).flat();

  // Prepare sidebar widgets for mobile distribution
  type SidebarWidget = {
    id: string;
    type: 'ad' | 'newsletter' | 'tags' | 'social' | 'popular' | 'recent';
    component: React.ReactElement | null;
  };

  const sidebarWidgets: SidebarWidget[] = [
    {
      id: 'ad-1',
      type: 'ad' as const,
      component: (
        <section key="ad-1" className="bg-gradient-to-br from-blue-500 to-purple-600 border border-gray-200/50 rounded-xl p-4 shadow-lg text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_50%)]" aria-hidden="true"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="w-4 h-4" />
              <h2 className="text-sm font-bold">Quảng cáo</h2>
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
            <p className="text-[10px] text-white/60 text-center">
              Liên hệ: <span className="font-semibold">quangcao@ctrlz.vn</span>
            </p>
          </div>
        </section>
      )
    },
    {
      id: 'newsletter',
      type: 'newsletter' as const,
      component: (
        <section key="newsletter" className="bg-gradient-to-br from-green-50 to-emerald-50 border border-gray-200/50 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-bold text-gray-900">Đăng ký nhận tin</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Nhận tin tức mới nhất từ Ctrl Z qua email
          </p>
          <form className="space-y-3">
            <input
              type="email"
              placeholder="Nhập email của bạn"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            />
            <button
              type="submit"
              className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors text-sm"
            >
              Đăng ký ngay
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Bạn có thể hủy đăng ký bất cứ lúc nào
          </p>
        </section>
      )
    },
    {
      id: 'tags',
      type: 'tags' as const,
      component: popularTags.length > 0 ? (
        <section key="tags" className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <TagIcon className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">Tags phổ biến</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <Link
                key={tag}
                href={`/tag/${toSlug(tag)}`}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium rounded-full transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </section>
      ) : null
    },
    {
      id: 'social',
      type: 'social' as const,
      component: (
        <section key="social" className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6 shadow-lg">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
            📱 Theo dõi chúng tôi
          </h2>
          <div className="space-y-3">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Facebook className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Facebook</p>
                <p className="text-xs text-gray-500">@CtrlZNews</p>
              </div>
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors group"
            >
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <Youtube className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-red-600 transition-colors">YouTube</p>
                <p className="text-xs text-gray-500">Ctrl Z Channel</p>
              </div>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors group"
            >
              <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center">
                <Twitter className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-sky-600 transition-colors">Twitter</p>
                <p className="text-xs text-gray-500">@CtrlZNews</p>
              </div>
            </a>
          </div>
        </section>
      )
    },
    {
      id: 'ad-2',
      type: 'ad' as const,
      component: (
        <section key="ad-2" className="bg-gradient-to-br from-orange-500 to-pink-600 border border-gray-200/50 rounded-xl p-4 shadow-lg text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.15),transparent_50%)]" aria-hidden="true"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="w-4 h-4" />
              <h2 className="text-sm font-bold">Ưu đãi đặc biệt</h2>
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
            <p className="text-[10px] text-white/60 text-center mt-2">
              Tạo chiến dịch quảng cáo hiệu quả
            </p>
          </div>
        </section>
      )
    }
  ].filter(w => w.component !== null);

  // Create combined array for mobile: mix categories with sidebar widgets randomly
  const categoriesWithMobileWidgets = CATEGORIES.map((category, idx) => ({
    type: 'category' as const,
    category,
    index: idx
  }));

  // Insert sidebar widgets at random positions between categories (mobile only)
  // Shuffle widgets to avoid duplicates
  const widgetsToInsert = [...sidebarWidgets];
  
  // Fisher-Yates shuffle
  for (let i = widgetsToInsert.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [widgetsToInsert[i], widgetsToInsert[j]] = [widgetsToInsert[j], widgetsToInsert[i]];
  }
  
  // Distribute widgets evenly between categories (avoid duplicates)
  const mobileContent: Array<{ type: 'category'; category: string } | { type: 'widget'; widget: SidebarWidget }> = [];
  const insertedWidgetIds = new Set<string>(); // Track inserted widget IDs to avoid duplicates
  let widgetInsertIndex = 0; // Track current position in widgetsToInsert array
  
  // Calculate widget insertion positions - distribute evenly between categories
  const totalCategories = categoriesWithMobileWidgets.length;
  const totalWidgets = widgetsToInsert.length;
  const insertAfterIndices: number[] = [];
  
  if (totalWidgets > 0 && totalCategories > 1) {
    // Simple distribution: insert widgets after evenly spaced categories
    // Example: 6 categories, 3 widgets -> insert after indices [1, 3, 4]
    // Example: 6 categories, 5 widgets -> insert after indices [0, 1, 2, 3, 4]
    const maxInsertions = Math.min(totalWidgets, totalCategories - 1);
    if (maxInsertions > 0) {
      // Distribute evenly: calculate step size
      const step = totalCategories / (maxInsertions + 1);
      for (let i = 1; i <= maxInsertions; i++) {
        const insertIndex = Math.floor(i * step) - 1; // -1 to insert AFTER category
        if (insertIndex >= 0 && insertIndex < totalCategories - 1) {
          insertAfterIndices.push(insertIndex);
        }
      }
      // Ensure we have enough positions for all widgets
      while (insertAfterIndices.length < maxInsertions && insertAfterIndices.length > 0) {
        const lastIdx = Math.max(...insertAfterIndices);
        if (lastIdx + 1 < totalCategories - 1) {
          insertAfterIndices.push(lastIdx + 1);
        } else {
          break;
        }
      }
      insertAfterIndices.sort((a, b) => a - b);
    }
  }
  
  // Build mobileContent array with widgets inserted between categories
  categoriesWithMobileWidgets.forEach((cat, idx) => {
    // Add category
    mobileContent.push(cat);
    
    // Insert widget after this category if it's in the insertion list
    if (insertAfterIndices.includes(idx) && widgetInsertIndex < widgetsToInsert.length) {
      // Get next widget that hasn't been inserted
      while (widgetInsertIndex < widgetsToInsert.length) {
        const widget = widgetsToInsert[widgetInsertIndex];
        widgetInsertIndex++;
        if (!insertedWidgetIds.has(widget.id)) {
          insertedWidgetIds.add(widget.id);
          mobileContent.push({ type: 'widget', widget });
          break;
        }
      }
    }
  });
  
  // Add remaining widgets that weren't inserted (at the end)
  while (widgetInsertIndex < widgetsToInsert.length) {
    const widget = widgetsToInsert[widgetInsertIndex];
    widgetInsertIndex++;
    if (!insertedWidgetIds.has(widget.id)) {
      insertedWidgetIds.add(widget.id);
      mobileContent.push({ type: 'widget', widget });
    }
  }

  return (
    <div className="min-h-screen" suppressHydrationWarning>
      {/* Modern Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white overflow-hidden">
        {/* Simple gradient background for better performance */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" aria-hidden="true"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10 text-center">
          {/* Icons - Centered */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <Newspaper className="w-10 h-10 md:w-12 md:h-12" />
            <div className="h-10 w-1 bg-white/30"></div>
            <TrendingUp className="w-8 h-8 md:w-10 md:h-10" />
          </div>
          
          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-4 leading-tight">
            📰 Ctrl Z
          </h1>
          
          {/* Slogan */}
          <p className="text-xl md:text-2xl lg:text-3xl text-blue-100 font-semibold mb-3 leading-relaxed">
            Hoàn tác tin giả - Khôi phục sự thật
          </p>
          
          {/* Sub-description */}
          <p className="text-base md:text-lg text-blue-200 max-w-3xl mx-auto leading-relaxed mb-8">
            Tin tức minh bạch, đa chiều từ mọi lĩnh vực: Công nghệ, Thể thao, Sức khỏe, Ô tô, Giải trí, Game
          </p>
          
          {/* Quick category links - Centered */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {CATEGORIES.map((category) => (
              <Link
                key={category}
                href={`/category/${categorySlugMap[category]}`}
                className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-sm font-semibold transition-all hover:scale-105"
              >
                {categoryIcons[category]} {category}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Magazine Style Layout */}
        
        {/* Featured Articles Section */}
        {(() => {
          const featuredArticles = allArticles
            .sort((a, b) => b.views - a.views)
            .slice(0, 4);
          
          return featuredArticles.length > 0 ? (
            <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full text-sm font-bold shadow-lg">
                <TrendingUp className="w-4 h-4" />
                TIN NỔI BẬT
              </div>
              <div className="h-0.5 flex-1 bg-gradient-to-r from-orange-500 to-transparent"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.slug}`}
                    className="group block"
                  >
                    <article className={`${getCardBgClasses(article.id)} border border-gray-200/50 rounded-xl overflow-hidden hover:shadow-xl hover:border-blue-300/50 hover:-translate-y-1 transition-all duration-300 shadow-md h-full`}>
                      {article.image_url && (
                        <div className="relative h-40 overflow-hidden">
                          <OptimizedImage
                            src={article.image_url}
                            alt={article.title}
                            fill
                            className="object-cover transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            objectFit="cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded">
                            {article.category}
                          </span>
                          <span className="text-xs text-gray-500">{article.views} lượt xem</span>
                        </div>
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm">
                          {article.title}
                        </h3>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          ) : null;
        })()}

        {/* Magazine Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Left Column - Large Articles */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mobile: Mixed Category Sections with Sidebar Widgets */}
            <div className="lg:hidden space-y-6">
              {mobileContent.map((item, idx) => {
                if (item.type === 'category') {
                  const categoryArticles = articlesByCategory[item.category];
                  if (!categoryArticles || categoryArticles.length === 0) return null;
                  
                  return (
                    <section key={item.category} className="border-b border-gray-200 pb-8 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between mb-4">
                        <Link href={`/category/${categorySlugMap[item.category]}`} className="flex items-center gap-2 group">
                          <span className="text-2xl">{categoryIcons[item.category]}</span>
                          <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {item.category}
                          </h2>
                        </Link>
                        <Link 
                          href={`/category/${categorySlugMap[item.category]}`}
                          className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          Xem tất cả →
                        </Link>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        {categoryArticles.slice(0, 5).map((article, articleIdx) => (
                          <Link
                            key={article.id}
                            href={`/articles/${article.slug}`}
                            className={`group block ${
                              articleIdx === 0 ? 'md:col-span-2' : ''
                            }`}
                          >
                            <article className={`${getCardBgClasses(article.id)} border border-gray-200/50 rounded-xl overflow-hidden hover:shadow-xl hover:border-blue-300/50 hover:-translate-y-1 transition-all duration-300 shadow-md h-full`}>
                              {article.image_url && (
                                <div className={`relative overflow-hidden ${
                                  articleIdx === 0 ? 'h-64' : 'h-40'
                                }`}>
                                  <OptimizedImage
                                    src={article.image_url}
                                    alt={article.title}
                                    fill
                                    className="object-cover transition-transform duration-300"
                                    sizes={articleIdx === 0 ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
                                    objectFit="cover"
                                    loading={articleIdx === 0 ? "eager" : "lazy"}
                                    priority={articleIdx === 0}
                          />
                                </div>
                              )}
                              <div className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded">
                                    {article.category}
                                  </span>
                                  <span className="text-xs text-gray-500">{article.views} lượt xem</span>
                                </div>
                                <h3 className={`font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 ${
                                  articleIdx === 0 ? 'text-xl' : 'text-base'
                                }`}>
                                  {article.title}
                                </h3>
                                {articleIdx === 0 && article.description && (
                                  <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                                    {article.description}
                                  </p>
                                )}
                              </div>
                            </article>
                          </Link>
                        ))}
                      </div>
                    </section>
                  );
                } else {
                  // Render sidebar widget on mobile
                  return <div key={item.widget.id}>{item.widget.component}</div>;
                }
              })}
            </div>

            {/* Desktop: Category Sections Only */}
            <div className="hidden lg:block space-y-6">
              {CATEGORIES.map((category) => {
                const categoryArticles = articlesByCategory[category];
                if (!categoryArticles || categoryArticles.length === 0) return null;
                
                return (
                  <section key={category} className="border-b border-gray-200 pb-8 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between mb-4">
                      <Link href={`/category/${categorySlugMap[category]}`} className="flex items-center gap-2 group">
                        <span className="text-2xl">{categoryIcons[category]}</span>
                        <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {category}
                        </h2>
                      </Link>
                      <Link 
                        href={`/category/${categorySlugMap[category]}`}
                        className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        Xem tất cả →
                      </Link>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {categoryArticles.slice(0, 5).map((article, idx) => (
                        <Link
                          key={article.id}
                          href={`/articles/${article.slug}`}
                          className={`group block ${
                            idx === 0 ? 'md:col-span-2' : ''
                          }`}
                        >
                          <article className={`${getCardBgClasses(article.id)} border border-gray-200/50 rounded-xl overflow-hidden hover:shadow-xl hover:border-blue-300/50 hover:-translate-y-1 transition-all duration-300 shadow-md h-full`}>
                            {article.image_url && (
                              <div className={`relative overflow-hidden ${
                                idx === 0 ? 'h-64' : 'h-40'
                              }`}>
                                <OptimizedImage
                                  src={article.image_url}
                                  alt={article.title}
                                  fill
                                  objectFit="cover"
                                  loading={idx === 0 ? "eager" : "lazy"}
                                  priority={idx === 0}
                                  className="object-cover transition-transform duration-300"
                                  sizes={idx === 0 ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
                                />
                              </div>
                            )}
                            <div className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded">
                                  {article.category}
                                </span>
                                <span className="text-xs text-gray-500">{article.views} lượt xem</span>
                              </div>
                              <h3 className={`font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 ${
                                idx === 0 ? 'text-xl' : 'text-base'
                              }`}>
                                {article.title}
                              </h3>
                              {idx === 0 && article.description && (
                                <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                                  {article.description}
                                </p>
                              )}
                            </div>
                          </article>
                        </Link>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>

          {/* Right Sidebar - Popular & Trending (Desktop Only) */}
          <aside className="hidden lg:block lg:col-span-1 space-y-6">
            {/* Popular Articles */}
            <section className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                📊 Đọc nhiều
              </h2>
              <div className="space-y-4">
                {allArticles
                  .sort((a, b) => b.views - a.views)
                  .slice(0, 5)
                  .map((article, idx) => (
                    <Link
                      key={article.id}
                      href={`/articles/${article.slug}`}
                      className="group flex gap-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                        <span className="text-xs text-gray-500">{article.category}</span>
                      </div>
                    </Link>
                  ))}
              </div>
            </section>

            {/* Recent Articles */}
            <section className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                🕐 Mới nhất
              </h2>
              <div className="space-y-4">
                {allArticles
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 5)
                  .map((article) => (
                    <Link
                      key={article.id}
                      href={`/articles/${article.slug}`}
                      className="group block"
                    >
                      {article.image_url && (
                        <div className="relative w-full h-32 mb-2 rounded-lg overflow-hidden">
                          <OptimizedImage
                            src={article.image_url}
                            alt={article.title}
                            fill
                            className="object-cover transition-transform duration-300"
                            sizes="(max-width: 1024px) 0vw, 320px"
                            objectFit="cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="px-2 py-0.5 bg-gray-100 rounded">{article.category}</span>
                      </div>
                    </Link>
                  ))}
              </div>
            </section>

            {/* Advertisement Banner - 728x90 Leaderboard */}
            <section className="bg-gradient-to-br from-blue-500 to-purple-600 border border-gray-200/50 rounded-xl p-4 shadow-lg text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_50%)]" aria-hidden="true"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Gift className="w-4 h-4" />
                  <h2 className="text-sm font-bold">Quảng cáo</h2>
                </div>
                {/* Banner Container - 728x90 */}
                <div className="w-full bg-white/10 backdrop-blur-sm rounded-lg p-2 mb-2 border border-white/20">
                  <a 
                    href="https://haudaiseo009.pages.dev/go/qh88?site=tintuc" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block w-full"
                  >
                    <OptimizedImage 
                      src="https://lh3.googleusercontent.com/d/12g3IJugKxAG0pt9KlYVXBOjbBVmNVR06=w1920?authuser=0" 
                      width={728}
                      height={90}
                      alt="Advertisement"
                      objectFit="contain"
                      loading="lazy"
                      className="w-full h-auto rounded"
                    />
                  </a>
                </div>
                <p className="text-[10px] text-white/60 text-center">
                  Liên hệ: <span className="font-semibold">quangcao@ctrlz.vn</span>
                </p>
              </div>
            </section>

            {/* Newsletter Signup */}
            <section className="bg-gradient-to-br from-green-50 to-emerald-50 border border-gray-200/50 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-bold text-gray-900">Đăng ký nhận tin</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Nhận tin tức mới nhất từ Ctrl Z qua email
              </p>
              <form className="space-y-3">
                <input
                  type="email"
                  placeholder="Nhập email của bạn"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors text-sm"
                >
                  Đăng ký ngay
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Bạn có thể hủy đăng ký bất cứ lúc nào
              </p>
            </section>

            {/* Popular Tags */}
            {popularTags.length > 0 && (
              <section className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <TagIcon className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-bold text-gray-900">Tags phổ biến</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/tag/${toSlug(tag)}`}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium rounded-full transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Social Media Links */}
            <section className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                📱 Theo dõi chúng tôi
              </h2>
              <div className="space-y-3">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Facebook className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Facebook</p>
                    <p className="text-xs text-gray-500">@CtrlZNews</p>
                  </div>
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors group"
                >
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                    <Youtube className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-red-600 transition-colors">YouTube</p>
                    <p className="text-xs text-gray-500">Ctrl Z Channel</p>
                  </div>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors group"
                >
                  <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center">
                    <Twitter className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-sky-600 transition-colors">Twitter</p>
                    <p className="text-xs text-gray-500">@CtrlZNews</p>
                  </div>
                </a>
              </div>
            </section>

            {/* Second Advertisement Banner - 728x90 Leaderboard */}
            <section className="bg-gradient-to-br from-orange-500 to-pink-600 border border-gray-200/50 rounded-xl p-4 shadow-lg text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.15),transparent_50%)]" aria-hidden="true"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Gift className="w-4 h-4" />
                  <h2 className="text-sm font-bold">Ưu đãi đặc biệt</h2>
                </div>
                {/* Banner Container - 728x90 */}
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
                    />
                  </a>
                </div>
                <p className="text-[10px] text-white/60 text-center mt-2">
                  Tạo chiến dịch quảng cáo hiệu quả
                </p>
              </div>
            </section>
          </aside>
        </div>


        {/* Empty state */}
        {allArticles.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <Newspaper className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Chưa có bài viết nào</h3>
            <p className="text-gray-500 mb-6">Hãy thêm bài viết đầu tiên để bắt đầu</p>
            <Link
              href="/admin"
              className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-all hover:scale-105"
            >
              Thêm bài viết đầu tiên
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
