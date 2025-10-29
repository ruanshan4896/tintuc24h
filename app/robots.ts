import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // Get base URL from environment variable
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tintuc.vercel.app';
  
  console.log('Robots.txt - Base URL:', baseUrl);

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/admin', '/api'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

