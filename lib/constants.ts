export const SITE_CONFIG = {
  name: 'TinTức',
  title: 'TinTức - Website Tin Tức Hiện Đại',
  description: 'Website tin tức được xây dựng với Next.js và Supabase. Cập nhật tin tức công nghệ, SEO và nhiều chủ đề khác.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://tintuc.vercel.app',
  ogImage: '/og-image.jpg',
  links: {
    twitter: 'https://twitter.com',
    github: 'https://github.com',
  },
};

export const CATEGORIES = [
  'Công nghệ',
  'Thể thao',
  'Sức khỏe',
  'Ô tô',
  'Giải trí',
  'Game',
] as const;

export const DEFAULT_CATEGORY = 'Công nghệ';

export const ITEMS_PER_PAGE = 12;

export const REVALIDATE_TIME = 60; // seconds

