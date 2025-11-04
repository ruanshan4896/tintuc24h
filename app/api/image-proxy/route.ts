import { NextRequest, NextResponse } from 'next/server';

/**
 * Image Proxy API Route
 * Proxies images from external sources (like vnexpress) with proper headers
 * to avoid 401 Unauthorized errors
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return new NextResponse('Missing image URL parameter', { status: 400 });
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
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://vnexpress.net/',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      // Add timeout to avoid hanging
      signal: AbortSignal.timeout(10000), // 10 seconds
    });

    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return new NextResponse(`Failed to fetch image: ${response.status}`, { 
        status: response.status === 401 ? 404 : response.status 
      });
    }

    // Get content type
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Get image buffer
    const imageBuffer = await response.arrayBuffer();

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
      },
    });

  } catch (error: any) {
    console.error('Image proxy error:', error.message);
    
    // Handle timeout
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return new NextResponse('Image fetch timeout', { status: 408 });
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

