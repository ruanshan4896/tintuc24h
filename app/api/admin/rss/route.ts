import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { CreateRssFeedInput } from '@/lib/types/rss';

// GET - List all RSS feeds
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('rss_feeds')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ feeds: data });
  } catch (error) {
    console.error('Error fetching RSS feeds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RSS feeds' },
      { status: 500 }
    );
  }
}

// POST - Create new RSS feed
export async function POST(request: NextRequest) {
  try {
    const body: CreateRssFeedInput = await request.json();
    
    console.log('Creating RSS feed with data:', body);
    
    // Validate input
    if (!body.name || !body.url || !body.category) {
      console.error('Validation failed:', { name: body.name, url: body.url, category: body.category });
      return NextResponse.json(
        { error: 'Name, URL, and category are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('rss_feeds')
      .insert({
        name: body.name,
        url: body.url,
        category: body.category,
        active: body.active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'RSS feed URL đã tồn tại' },
          { status: 409 }
        );
      }
      
      if (error.code === '42P01') { // Table does not exist
        return NextResponse.json(
          { error: 'Table rss_feeds chưa được tạo. Vui lòng chạy SQL script trong supabase/rss-feeds.sql' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: `Lỗi Supabase: ${error.message}`, code: error.code, details: error.details },
        { status: 500 }
      );
    }

    console.log('RSS feed created successfully:', data);
    return NextResponse.json({ feed: data }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to create RSS feed', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete RSS feed
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Feed ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('rss_feeds')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to delete RSS feed' },
      { status: 500 }
    );
  }
}

