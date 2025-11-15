import { NextRequest, NextResponse } from 'next/server';
import { createArticleAdmin, updateArticleAdmin, deleteArticleAdmin } from '@/lib/api/admin-articles';
import { supabaseAdmin } from '@/lib/supabase/server';

// GET - Get articles list (optimized for admin page)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // Allow custom limit, but default to no limit (or very high limit) to show all articles
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : null;
    
    // Only select fields needed for admin list view (NOT content!)
    let query = supabaseAdmin
      .from('articles')
      .select('id, title, slug, category, published, views, created_at')
      .order('created_at', { ascending: false });
    
    // Only apply limit if specified (for performance testing)
    if (limit && limit > 0) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching articles:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch articles' },
        { status: 500 }
      );
    }

    return NextResponse.json({ articles: data || [] }, { status: 200 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new article
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, error } = await createArticleAdmin(body);

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to create article' },
        { status: 400 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update article (full update)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, error } = await updateArticleAdmin(body);

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to update article' },
        { status: 400 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Partial update (for bulk operations like publish)
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { data, error } = await updateArticleAdmin({ id, ...body });

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to update article' },
        { status: 400 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete article
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    const { success, error } = await deleteArticleAdmin(id);

    if (!success || error) {
      return NextResponse.json(
        { error: error?.message || 'Failed to delete article' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

