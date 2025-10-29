import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, secret } = body;

    // Verify secret token (optional but recommended for production)
    const revalidateSecret = process.env.REVALIDATE_SECRET;
    if (revalidateSecret && secret !== revalidateSecret) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    // Revalidate specific path or default paths
    if (path) {
      revalidatePath(path);
      console.log(`Revalidated path: ${path}`);
    } else {
      // Revalidate all important paths
      revalidatePath('/');
      revalidatePath('/sitemap.xml');
      console.log('Revalidated: /, /sitemap.xml');
    }

    return NextResponse.json(
      { revalidated: true, now: Date.now() },
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
    const path = searchParams.get('path');

    // Verify secret token
    const revalidateSecret = process.env.REVALIDATE_SECRET;
    if (revalidateSecret && secret !== revalidateSecret) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    // Revalidate specific path or default paths
    if (path) {
      revalidatePath(path);
      console.log(`Revalidated path: ${path}`);
    } else {
      // Revalidate all important paths
      revalidatePath('/');
      revalidatePath('/sitemap.xml');
      console.log('Revalidated: /, /sitemap.xml');
    }

    return NextResponse.json(
      { revalidated: true, now: Date.now() },
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

