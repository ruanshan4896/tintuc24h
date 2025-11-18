import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import dynamic from 'next/dynamic';
// Analytics only for production to improve dev performance
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from 'next/script';

// Lazy load Footer to reduce initial bundle
const Footer = dynamic(() => import('@/components/Footer'), {
  loading: () => <div className="h-64 bg-gray-900" />,
  ssr: true, // Keep SSR for SEO
});

// Optimize font loading
const inter = Inter({ 
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
  variable: '--font-inter',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3B82F6' },
    { media: '(prefers-color-scheme: dark)', color: '#1E40AF' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://tintuc24h-seven.vercel.app'),
  title: {
    default: 'Ctrl Z - Tin tức mới nhất mỗi ngày',
    template: '%s | Ctrl Z'
  },
  description: 'Cập nhật tin tức nóng hổi từ mọi lĩnh vực: Tin Nóng, Công nghệ, Thể thao, Sức khỏe, Ô tô, Giải trí, Game',
  keywords: ['tin tức', 'news', 'công nghệ', 'thể thao', 'sức khỏe', 'ô tô', 'giải trí', 'game', 'ctrl z', 'tin tức mới nhất'],
  authors: [{ name: 'Ctrl Z Team' }],
  creator: 'Ctrl Z',
  publisher: 'Ctrl Z',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: '/',
    siteName: 'Ctrl Z',
    title: 'Ctrl Z - Tin tức mới nhất mỗi ngày',
    description: 'Cập nhật tin tức nóng hổi từ mọi lĩnh vực: Tin Nóng, Công nghệ, Thể thao, Sức khỏe, Ô tô, Giải trí, Game',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ctrl Z - Tin tức mới nhất mỗi ngày',
    description: 'Cập nhật tin tức nóng hổi từ mọi lĩnh vực: Tin Nóng, Công nghệ, Thể thao, Sức khỏe, Ô tô, Giải trí, Game',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'Smfp6CDotxjXnPeit-7Kw41bOvV1McfSzgqwTZDzq3o',
  },
  category: 'news',
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': [{ url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tintuc24h-seven.vercel.app'}/rss.xml`, title: 'Ctrl Z RSS Feed' }],
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tintuc24h-seven.vercel.app';
  
  // Organization schema for SEO
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Ctrl Z',
    alternateName: 'Ctrl Z News',
    url: baseUrl,
    logo: `${baseUrl}/og-image.jpg`,
    description: 'Ctrl Z - Transparent, multi-dimensional news.',
    sameAs: [
      // Add social media links when available
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['vi'],
    },
  };

  // WebSite schema with searchAction
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Ctrl Z',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="vi">
      <head>
        {/* Preconnect to Google Drive for faster image loading */}
        <link rel="preconnect" href="https://lh3.googleusercontent.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        <link rel="preconnect" href="https://drive.google.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://drive.google.com" />
      </head>
      <body suppressHydrationWarning className={inter.className}>
        {/* Structured Data - Organization */}
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        
        {/* Structured Data - WebSite */}
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        
        <div className="bg-gradient-to-br from-gray-100 via-blue-50 to-indigo-50 min-h-screen">
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow" id="main-content">
              {children}
            </main>
            <Footer />
          </div>
        </div>
        
        {/* PWA Service Worker registration - Client-side only */}
        <Script id="service-worker" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
              });
            }
          `}
        </Script>
        
        {/* Only load analytics in production */}
        {process.env.NODE_ENV === 'production' && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  );
}
