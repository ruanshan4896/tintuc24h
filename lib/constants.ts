export const SITE_CONFIG = {
  name: 'Ctrl Z',
  title: 'Ctrl Z - Hoàn tác tin giả, Khôi phục sự thật',
  description: 'Ctrl Z - Tin tức minh bạch, đa chiều. Hoàn tác tin giả, khôi phục sự thật. Cập nhật tin tức Công nghệ, Thể thao, Sức khỏe, Ô tô, Giải trí, Game.',
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

