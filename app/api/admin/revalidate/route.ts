import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin wrapper for revalidate API
 * Automatically injects REVALIDATE_SECRET so client code doesn't need to know it
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path } = body;

    // Call the actual revalidate API with secret injected
    const revalidateSecret = process.env.REVALIDATE_SECRET;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    const response = await fetch(`${siteUrl}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path,
        secret: revalidateSecret, // Inject secret here (server-side only)
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Revalidate error:', result);
      return NextResponse.json(
        { error: result.error || 'Failed to revalidate' },
        { status: response.status }
      );
    }

    console.log('Revalidated successfully:', path || 'default paths');
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Admin revalidate error:', error);
    return NextResponse.json(
      { error: 'Failed to revalidate', details: error.message },
      { status: 500 }
    );
  }
}

