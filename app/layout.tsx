import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

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
    default: 'TinTức - Website Tin Tức Hiện Đại',
    template: '%s | TinTức'
  },
  description: 'Website tin tức được xây dựng với Next.js và Supabase. Cập nhật tin tức công nghệ, SEO và nhiều chủ đề khác.',
  keywords: ['tin tức', 'news', 'công nghệ', 'SEO', 'Next.js', 'Vietnam', 'thể thao', 'sức khỏe', 'ô tô', 'giải trí'],
  authors: [{ name: 'TinTức Team' }],
  creator: 'TinTức',
  publisher: 'TinTức',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: '/',
    siteName: 'TinTức',
    title: 'TinTức - Website Tin Tức Hiện Đại',
    description: 'Website tin tức được xây dựng với Next.js và Supabase',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TinTức',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TinTức - Website Tin Tức Hiện Đại',
    description: 'Website tin tức được xây dựng với Next.js và Supabase',
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
  alternates: {
    canonical: '/',
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
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        
        {/* Favicon optimized */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow" id="main-content">
            {children}
          </main>
          <Footer />
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
