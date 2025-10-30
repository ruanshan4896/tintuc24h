/**
 * Convert Vietnamese text to URL-safe slug
 * @param text - Text to convert (e.g. "Giải trí")
 * @returns URL-safe slug (e.g. "giai-tri")
 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose combined characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd') // Replace đ
    .replace(/Đ/g, 'd') // Replace Đ
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

/**
 * Category name to slug mapping
 */
export const categoryToSlug: { [key: string]: string } = {
  'Công nghệ': 'cong-nghe',
  'Thể thao': 'the-thao',
  'Sức khỏe': 'suc-khoe',
  'Ô tô': 'o-to',
  'Giải trí': 'giai-tri',
  'Kinh doanh': 'kinh-doanh',
  'Du lịch': 'du-lich',
  'Giáo dục': 'giao-duc',
  'Thời trang': 'thoi-trang',
  'Ẩm thực': 'am-thuc',
};

/**
 * Get category slug from name
 * @param categoryName - Category name in Vietnamese
 * @returns Category slug
 */
export function getCategorySlug(categoryName: string): string {
  return categoryToSlug[categoryName] || toSlug(categoryName);
}

