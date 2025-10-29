/**
 * Unsplash API Helper
 * Search and fetch free images from Unsplash
 */

interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  description: string | null;
  user: {
    name: string;
    username: string;
  };
  links: {
    html: string;
  };
}

interface UnsplashSearchResult {
  total: number;
  total_pages: number;
  results: UnsplashImage[];
}

/**
 * Search images on Unsplash by keywords
 * @param query - Search keywords (extracted from title)
 * @param perPage - Number of results (default: 3)
 * @returns Array of image URLs or null
 */
export async function searchUnsplashImages(
  query: string,
  perPage: number = 3
): Promise<{ url: string; alt: string; credit: string }[] | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    console.warn('⚠️ UNSPLASH_ACCESS_KEY not found. Skipping image search.');
    return null;
  }

  try {
    console.log(`🖼️ Searching Unsplash for: "${query}"`);

    const url = new URL('https://api.unsplash.com/search/photos');
    url.searchParams.append('query', query);
    url.searchParams.append('per_page', perPage.toString());
    url.searchParams.append('orientation', 'landscape');
    url.searchParams.append('content_filter', 'high'); // Safe content only

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      console.error('❌ Unsplash API error:', response.status, response.statusText);
      return null;
    }

    const data: UnsplashSearchResult = await response.json();

    if (!data.results || data.results.length === 0) {
      console.warn('⚠️ No images found for query:', query);
      return null;
    }

    const images = data.results.map((img) => ({
      url: img.urls.regular, // High quality, optimized
      alt: img.alt_description || img.description || query,
      credit: `Photo by ${img.user.name} on Unsplash`,
      creditLink: img.links.html,
    }));

    console.log(`✅ Found ${images.length} images from Unsplash`);
    return images;
  } catch (error: any) {
    console.error('❌ Error searching Unsplash:', error.message);
    return null;
  }
}

/**
 * Extract main keywords from title for image search
 * @param title - Article title
 * @returns Cleaned keywords for search
 */
export function extractImageKeywords(title: string): string {
  // Remove common Vietnamese stop words and punctuation
  const stopWords = [
    'của', 'và', 'là', 'có', 'để', 'được', 'trong', 'tại', 'với', 'cho',
    'từ', 'về', 'theo', 'đã', 'sẽ', 'thì', 'này', 'đó', 'hay', 'hoặc',
    'như', 'khi', 'nếu', 'vì', 'bởi', 'cùng', 'nhưng', 'mà', 'bằng', 'không'
  ];

  let keywords = title
    .toLowerCase()
    .replace(/[?!.,;:'"]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .slice(0, 5) // Take first 5 meaningful words
    .join(' ');

  // If too short, use original title
  if (keywords.length < 10) {
    keywords = title.replace(/[?!.,;:'"]/g, '');
  }

  console.log(`🔍 Image keywords: "${keywords}"`);
  return keywords;
}

