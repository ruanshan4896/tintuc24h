import { MetadataRoute } from 'next';
import { getArticles, getCategories } from '@/lib/api/articles';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tintuc.vercel.app';
  
  // Get all published articles
  const articles = await getArticles(true);
  
  // Get all categories
  const categories = await getCategories();

  // Home page
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
  ];

  // Article pages
  const articleRoutes = articles.map((article) => ({
    url: `${baseUrl}/articles/${article.slug}`,
    lastModified: new Date(article.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Category pages
  const categoryRoutes = categories.map((category) => ({
    url: `${baseUrl}/category/${category.toLowerCase().replace(/\s+/g, '-')}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  return [...routes, ...articleRoutes, ...categoryRoutes];
}

