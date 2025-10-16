import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { SearchResult } from '@/lib/types/database';
import { createRateLimiter, RateLimitPresets, getRateLimitHeaders } from '@/lib/utils/rate-limit';

// Enable Edge Runtime for faster response times
// Edge functions run closer to users globally and have lower cold start times
export const runtime = 'edge';

// Cache search results for 60 seconds (stale-while-revalidate pattern)
export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get user for rate limiting (optional authentication)
    const { data: { user } } = await supabase.auth.getUser();

    // Rate limiting for search queries
    const limiter = createRateLimiter(RateLimitPresets.search);
    const rateLimitResult = limiter(request, user?.id);

    if (!rateLimitResult.success) {
      const headers = getRateLimitHeaders(rateLimitResult);
      return NextResponse.json(
        { error: 'Too many search requests. Please try again later.' },
        { status: 429, headers }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    // Validate query parameter
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Minimum query length
    if (query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Call the search_content PostgreSQL function
    const { data, error } = await supabase.rpc('search_content', {
      search_query: query.trim(),
    });

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json(
        { error: 'Failed to perform search' },
        { status: 500 }
      );
    }

    // Transform results to include computed URL
    const results: SearchResult[] = (data || []).map((item: any) => ({
      type: item.type,
      id: item.id,
      title: item.title,
      excerpt: item.excerpt || '',
      rank: item.rank,
      created_at: item.created_at,
      url:
        item.type === 'article'
          ? `/articles/${item.id}`
          : `/qa/questions/${item.id}`,
    }));

    return NextResponse.json({
      results,
      count: results.length,
      query: query.trim(),
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
