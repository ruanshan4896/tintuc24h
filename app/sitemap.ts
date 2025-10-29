import { MetadataRoute } from 'next';
import { getArticlesServer } from '@/lib/api/articles-server';
import { CATEGORIES } from '@/lib/constants';

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tintuc.vercel.app';
  
  console.log('Generating sitemap for:', baseUrl);
  
  try {
    // Get all published articles using server API (bypass RLS)
    const articles = await getArticlesServer(true);
    console.log(`Sitemap: Found ${articles.length} articles`);
    
    // Home page
    const routes: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/search`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.5,
      },
    ];

    // Article pages
    const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
      url: `${baseUrl}/articles/${article.slug}`,
      lastModified: new Date(article.updated_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // Category pages (use constants to ensure consistency)
    const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
      url: `${baseUrl}/category/${category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    }));

    const fullSitemap = [...routes, ...articleRoutes, ...categoryRoutes];
    console.log(`Sitemap: Generated ${fullSitemap.length} total URLs`);
    
    return fullSitemap;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return at least the homepage if there's an error
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ];
  }
}

