import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for failed URLs (to avoid retrying immediately)
const failedUrls = new Map<string, number>();
const FAILED_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Image Proxy API Route
 * Proxies images from external sources (like vnexpress) with proper headers
 * to avoid 401 Unauthorized errors
 * 
 * Optimizations:
 * - Reduced timeout to 5s for faster failure
 * - Better error handling with failed URL cache
 * - Improved caching headers
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return new NextResponse('Missing image URL parameter', { status: 400 });
    }

    // Check if URL recently failed
    const failedAt = failedUrls.get(imageUrl);
    if (failedAt && Date.now() - failedAt < FAILED_CACHE_TTL) {
      return new NextResponse('Image temporarily unavailable', { status: 404 });
    }

    // Validate URL
    let url: URL;
    try {
      url = new URL(imageUrl);
    } catch {
      return new NextResponse('Invalid image URL', { status: 400 });
    }

    // Only allow specific domains for security - all vnexpress subdomains
    const allowedHosts = [
      'vnexpress.net',
      '*.vnexpress.net',
      '*.vnecdn.net', // This covers all subdomains like i1-thethao.vnecdn.net, i2-vnexpress.vnecdn.net, etc.
    ];

    const hostname = url.hostname;
    const isAllowed = allowedHosts.some(host => {
      if (host.startsWith('*.')) {
        const domainSuffix = host.slice(2);
        // Check if hostname ends with the domain suffix
        return hostname === domainSuffix || hostname.endsWith(`.${domainSuffix}`);
      }
      return hostname === host || hostname.endsWith(`.${host}`);
    });

    if (!isAllowed) {
      return new NextResponse('Domain not allowed', { status: 403 });
    }

    // Fetch image with proper headers to avoid 401
    // Reduced timeout to 5s for faster failure
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://vnexpress.net/',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      // Reduced timeout to 3s for faster failure
      signal: AbortSignal.timeout(3000), // 3 seconds (reduced from 5s for faster failure)
    });

    if (!response.ok) {
      // Cache failed URL
      failedUrls.set(imageUrl, Date.now());
      
      // Clean up old entries periodically
      if (failedUrls.size > 1000) {
        const now = Date.now();
        for (const [url, timestamp] of failedUrls.entries()) {
          if (now - timestamp > FAILED_CACHE_TTL) {
            failedUrls.delete(url);
          }
        }
      }
      
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      return new NextResponse(`Failed to fetch image: ${response.status}`, { 
        status: response.status === 401 ? 404 : response.status 
      });
    }

    // Get content type
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Get image buffer
    const imageBuffer = await response.arrayBuffer();

    // Remove from failed cache if successful
    failedUrls.delete(imageUrl);

    // Return image with proper headers - aggressive caching
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        // Add ETag for better caching
        'ETag': `"${Buffer.from(imageUrl).toString('base64').slice(0, 32)}"`,
        // Add Vary header for better CDN caching
        'Vary': 'Accept-Encoding',
      },
    });

  } catch (error: any) {
    // Cache failed URL
    const imageUrl = request.nextUrl.searchParams.get('url');
    if (imageUrl) {
      failedUrls.set(imageUrl, Date.now());
    }
    
    // Handle timeout - only log in development
    if (error.name === 'AbortError' || error.message.includes('timeout') || error.code === 23) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Image proxy timeout:', imageUrl?.substring(0, 80));
      }
      return new NextResponse('Image fetch timeout', { status: 408 });
    }

    // Only log other errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Image proxy error:', error.message);
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

