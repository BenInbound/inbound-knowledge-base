import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    // Filter parameters
    const status = searchParams.get('status') || 'published';
    const categoryId = searchParams.get('category');
    const authorId = searchParams.get('author');

    // Build query
    let query = supabase
      .from('articles')
      .select(
        `
        id,
        title,
        slug,
        excerpt,
        status,
        author_id,
        published_at,
        created_at,
        updated_at,
        view_count
      `,
        { count: 'exact' }
      )
      .eq('status', status)
      .order('published_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (categoryId) {
      query = query.contains('id', [categoryId]);
    }

    if (authorId) {
      query = query.eq('author_id', authorId);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Articles API error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch articles' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        data: [],
        meta: {
          page,
          limit,
          total: count || 0,
          total_pages: 0,
          has_next: false,
          has_prev: false,
        },
      });
    }

    // Fetch profiles for all authors
    const authorIds = [...new Set(data.map((a: any) => a.author_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', authorIds);

    // Create a map of author_id -> full_name
    const authorMap = new Map(
      (profiles || []).map((p: any) => [p.id, p.full_name])
    );

    // Transform data to include author details
    const articles = data.map((article: any) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      status: article.status,
      author_id: article.author_id,
      author_name: authorMap.get(article.author_id) || 'Unknown',
      published_at: article.published_at,
      created_at: article.created_at,
      updated_at: article.updated_at,
      view_count: article.view_count,
    }));

    return NextResponse.json({
      data: articles,
      meta: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
        has_next: offset + limit < (count || 0),
        has_prev: page > 1,
      },
    });
  } catch (error) {
    console.error('Articles API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
