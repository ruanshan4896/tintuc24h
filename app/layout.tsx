import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata: Metadata = {
  title: {
    default: 'TinTức - Website Tin Tức Hiện Đại',
    template: '%s | TinTức'
  },
  description: 'Website tin tức được xây dựng với Next.js và Supabase. Cập nhật tin tức công nghệ, SEO và nhiều chủ đề khác.',
  keywords: ['tin tức', 'news', 'công nghệ', 'SEO', 'Next.js', 'Vietnam'],
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
    url: 'https://tintuc.vercel.app',
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
