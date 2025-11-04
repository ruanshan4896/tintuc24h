export const SITE_CONFIG = {
  name: 'Ctrl Z',
  title: 'Ctrl Z - Hoàn tác tin giả, Khôi phục sự thật',
  description: 'Ctrl Z - Tin tức minh bạch, đa chiều. Hoàn tác tin giả, khôi phục sự thật. Cập nhật tin tức Tin Nóng, Công nghệ, Thể thao, Sức khỏe, Ô tô, Giải trí, Game.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://tintuc.vercel.app',
  ogImage: '/og-image.jpg',
  links: {
    twitter: 'https://twitter.com',
    github: 'https://github.com',
  },
};

export const CATEGORIES = [
  'Tin Nóng',
  'Công nghệ',
  'Thể thao',
  'Sức khỏe',
  'Ô tô',
  'Giải trí',
  'Game',
] as const;

export const DEFAULT_CATEGORY = 'Công nghệ';

// Category display names mapping (internal name -> display name)
export const CATEGORY_DISPLAY_NAMES: { [key: string]: string } = {
  'Công nghệ': 'Ctrl Z Công Nghệ',
  'Thể thao': 'Ctrl Z Thể Thao',
  'Sức khỏe': 'Ctrl Z Sức Khỏe',
  'Ô tô': 'Ctrl Z Xe',
  'Giải trí': 'Ctrl Z Showbiz',
  'Game': 'Ctrl Z Game',
  'Tin Nóng': 'Ctrl Z Tin Nóng',
};

// Category navigation names (without "Ctrl Z" prefix)
export const CATEGORY_NAV_NAMES: { [key: string]: string } = {
  'Công nghệ': 'Công Nghệ',
  'Thể thao': 'Thể Thao',
  'Sức khỏe': 'Sức Khỏe',
  'Ô tô': 'Xe',
  'Giải trí': 'Showbiz',
  'Game': 'Game',
  'Tin Nóng': 'Tin Nóng',
};

/**
 * Get display name for category
 * @param categoryName - Internal category name
 * @returns Display name or original name if not found
 */
export function getCategoryDisplayName(categoryName: string): string {
  return CATEGORY_DISPLAY_NAMES[categoryName] || categoryName;
}

/**
 * Get navigation name for category (without "Ctrl Z" prefix)
 * @param categoryName - Internal category name
 * @returns Navigation name without prefix or original name if not found
 */
export function getCategoryNavName(categoryName: string): string {
  return CATEGORY_NAV_NAMES[categoryName] || categoryName;
}

export const ITEMS_PER_PAGE = 12;

export const REVALIDATE_TIME = 60; // seconds

