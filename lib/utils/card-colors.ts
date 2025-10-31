/**
 * Generate consistent color for article cards based on article ID or slug
 * Returns background gradient colors
 */

const CARD_COLORS = [
  'from-blue-50 to-cyan-50',
  'from-purple-50 to-pink-50',
  'from-green-50 to-emerald-50',
  'from-yellow-50 to-orange-50',
  'from-pink-50 to-rose-50',
  'from-indigo-50 to-blue-50',
  'from-teal-50 to-cyan-50',
  'from-amber-50 to-yellow-50',
  'from-violet-50 to-purple-50',
  'from-emerald-50 to-teal-50',
  'from-rose-50 to-pink-50',
  'from-cyan-50 to-blue-50',
] as const;

/**
 * Get consistent gradient color for a card based on article ID or slug
 * Same article will always return the same color
 */
export function getCardGradient(idOrSlug: string): string {
  // Simple hash function to convert ID/slug to index
  let hash = 0;
  for (let i = 0; i < idOrSlug.length; i++) {
    hash = idOrSlug.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % CARD_COLORS.length;
  return CARD_COLORS[index];
}

/**
 * Get card background classes with gradient
 */
export function getCardBgClasses(idOrSlug: string, baseClasses = 'bg-white/90'): string {
  const gradient = getCardGradient(idOrSlug);
  return `${baseClasses} bg-gradient-to-br ${gradient} backdrop-blur-sm`;
}
