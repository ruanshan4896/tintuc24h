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
 * Translate Vietnamese keywords to English using AI
 * @param vietnameseKeywords - Keywords in Vietnamese
 * @returns English keywords for Unsplash search
 */
async function translateToEnglish(vietnameseKeywords: string): Promise<string> {
  const googleApiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!googleApiKey) {
    console.warn('⚠️ No AI key, using Vietnamese keywords (may not find images)');
    return vietnameseKeywords;
  }

  try {
    const prompt = `Translate these Vietnamese keywords to English for image search. Return ONLY the English keywords, no explanation.

Vietnamese: ${vietnameseKeywords}
English:`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      console.warn('⚠️ AI translation failed, using original keywords');
      return vietnameseKeywords;
    }

    const data = await response.json();
    const englishKeywords = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || vietnameseKeywords;
    
    console.log(`🌐 Translated: "${vietnameseKeywords}" → "${englishKeywords}"`);
    return englishKeywords;
  } catch (error: any) {
    console.error('❌ Translation error:', error.message);
    return vietnameseKeywords;
  }
}

/**
 * Extract main keywords from title for image search
 * @param title - Article title (Vietnamese)
 * @returns English keywords for Unsplash search
 */
export async function extractImageKeywords(title: string): Promise<string> {
  // Remove common Vietnamese stop words and punctuation
  const stopWords = [
    'của', 'và', 'là', 'có', 'để', 'được', 'trong', 'tại', 'với', 'cho',
    'từ', 'về', 'theo', 'đã', 'sẽ', 'thì', 'này', 'đó', 'hay', 'hoặc',
    'như', 'khi', 'nếu', 'vì', 'bởi', 'cùng', 'nhưng', 'mà', 'bằng', 'không',
    'các', 'những', 'một', 'vào', 'ra', 'đến', 'lên', 'xuống', 'bị', 'làm'
  ];

  // Extract meaningful Vietnamese keywords first
  let vietnameseKeywords = title
    .toLowerCase()
    .replace(/[?!.,;:'"]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .slice(0, 6) // Take first 6 meaningful words
    .join(' ');

  // If too short, use original title
  if (vietnameseKeywords.length < 10) {
    vietnameseKeywords = title.replace(/[?!.,;:'"]/g, '').substring(0, 100);
  }

  console.log(`🔍 Vietnamese keywords: "${vietnameseKeywords}"`);

  // Translate to English for Unsplash search
  const englishKeywords = await translateToEnglish(vietnameseKeywords);
  
  return englishKeywords;
}

