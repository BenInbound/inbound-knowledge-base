import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Filter parameters
    const parentId = searchParams.get('parent');
    const includeCount = searchParams.get('count') === 'true';

    // Build query
    let query = supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    // Filter by parent_id
    if (parentId === 'null' || parentId === 'root') {
      // Get root categories (no parent)
      query = query.is('parent_id', null);
    } else if (parentId) {
      // Get subcategories of a specific parent
      query = query.eq('parent_id', parentId);
    }

    const { data: categories, error } = await query;

    if (error) {
      console.error('Categories API error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    // Optionally include article count for each category
    let response = categories;
    if (includeCount && categories) {
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const { count } = await supabase
            .from('article_categories')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id);

          return {
            ...category,
            article_count: count || 0,
          };
        })
      );
      response = categoriesWithCount;
    }

    return NextResponse.json({
      data: response,
      count: response?.length || 0,
    });
  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
