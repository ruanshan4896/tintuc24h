import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, paths, secret } = body ?? {};

    // Verify secret token (optional but recommended for production)
    const revalidateSecret = process.env.REVALIDATE_SECRET;
    if (revalidateSecret && secret !== revalidateSecret) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    // Revalidate specific path or default paths
    const pathsToRevalidate = new Set<string>();
    if (Array.isArray(paths)) {
      paths.forEach((item: string) => {
        if (typeof item === 'string' && item.trim().length > 0) {
          pathsToRevalidate.add(item.startsWith('/') ? item : `/${item}`);
        }
      });
    }
    if (typeof path === 'string' && path.trim().length > 0) {
      pathsToRevalidate.add(path.startsWith('/') ? path : `/${path}`);
    }

    if (pathsToRevalidate.size === 0) {
      [
        '/',
        '/sitemap.xml',
        '/post-sitemap.xml',
        '/page-sitemap.xml',
        '/category-sitemap.xml',
        '/tag-sitemap.xml',
      ].forEach((defaultPath) => pathsToRevalidate.add(defaultPath));
    }

    pathsToRevalidate.forEach((p) => {
      revalidatePath(p);
      console.log(`Revalidated path: ${p}`);
    });

    // Bust cache tags used by unstable_cache
    revalidateTag('articles', { revalidate: true });
    revalidateTag('tags', { revalidate: true });

    return NextResponse.json(
      { revalidated: true, paths: Array.from(pathsToRevalidate), now: Date.now() },
      { status: 200 }
    );
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Error revalidating' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const pathParam = searchParams.getAll('path');

    // Verify secret token
    const revalidateSecret = process.env.REVALIDATE_SECRET;
    if (revalidateSecret && secret !== revalidateSecret) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    const pathsToRevalidate = new Set<string>();
    pathParam.forEach((item) => {
      if (typeof item === 'string' && item.trim().length > 0) {
        pathsToRevalidate.add(item.startsWith('/') ? item : `/${item}`);
      }
    });

    if (pathsToRevalidate.size === 0) {
      [
        '/',
        '/sitemap.xml',
        '/post-sitemap.xml',
        '/page-sitemap.xml',
        '/category-sitemap.xml',
        '/tag-sitemap.xml',
      ].forEach((defaultPath) => pathsToRevalidate.add(defaultPath));
    }

    pathsToRevalidate.forEach((p) => {
      revalidatePath(p);
      console.log(`Revalidated path: ${p}`);
    });

    revalidateTag('articles', { revalidate: true });
    revalidateTag('tags', { revalidate: true });

    return NextResponse.json(
      { revalidated: true, paths: Array.from(pathsToRevalidate), now: Date.now() },
      { status: 200 }
    );
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Error revalidating' },
      { status: 500 }
    );
  }
}

