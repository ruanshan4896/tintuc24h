import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import dynamic from 'next/dynamic';
// Analytics only for production to improve dev performance
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

// Lazy load Footer to reduce initial bundle
const Footer = dynamic(() => import('@/components/Footer'), {
  loading: () => <div className="h-64 bg-gray-900" />,
  ssr: true, // Keep SSR for SEO
});

// Optimize font loading
const inter = Inter({ 
  subsets: ['latin', 'vietnamese'],
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
    default: 'Ctrl Z - Hoàn tác tin giả, Khôi phục sự thật',
    template: '%s | Ctrl Z'
  },
  description: 'Ctrl Z - Tin tức minh bạch, đa chiều. Hoàn tác tin giả, khôi phục sự thật. Cập nhật tin tức Công nghệ, Thể thao, Sức khỏe, Ô tô, Giải trí, Game.',
  keywords: ['ctrl z', 'tin tức', 'news', 'công nghệ', 'thể thao', 'sức khỏe', 'ô tô', 'giải trí', 'game', 'tin tức minh bạch', 'Vietnam'],
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
    title: 'Ctrl Z - Hoàn tác tin giả, Khôi phục sự thật',
    description: 'Tin tức minh bạch, đa chiều từ mọi lĩnh vực: Công nghệ, Thể thao, Sức khỏe, Ô tô, Giải trí, Game',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Ctrl Z',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ctrl Z - Hoàn tác tin giả, Khôi phục sự thật',
    description: 'Tin tức minh bạch, đa chiều từ mọi lĩnh vực: Công nghệ, Thể thao, Sức khỏe, Ô tô, Giải trí, Game',
    images: ['/og-image.jpg'],
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Preconnect to external domains for faster image loading */}
        <link rel="preconnect" href="https://i1-vnexpress.vnecdn.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.24h.com.vn" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://i1-vnexpress.vnecdn.net" />
        <link rel="dns-prefetch" href="https://cdn.24h.com.vn" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        
        {/* Critical CSS for above-the-fold content */}
        <style dangerouslySetInnerHTML={{
          __html: `
            :root { font-family: system-ui, -apple-system, sans-serif; }
            body { margin: 0; overflow-x: hidden; }
            #main-content { min-height: 60vh; }
          `
        }} />
        
        {/* Favicon optimized */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        
        {/* PWA Service Worker registration */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
              });
            }
          `
        }} />
      </head>
      <body className={`${inter.className} bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100`} suppressHydrationWarning>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow" id="main-content">
            {children}
          </main>
          <Footer />
        </div>
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
