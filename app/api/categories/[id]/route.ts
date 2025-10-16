import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const includeArticles = searchParams.get('articles') === 'true';

    // Fetch category
    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get article count
    const { count: articleCount } = await supabase
      .from('article_categories')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    // Get subcategory count
    const { count: subcategoryCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', id);

    let response: any = {
      ...category,
      article_count: articleCount || 0,
      subcategory_count: subcategoryCount || 0,
    };

    // Optionally include articles
    if (includeArticles) {
      const { data: articleCategories } = await supabase
        .from('article_categories')
        .select(
          `
          article:articles(
            id,
            title,
            slug,
            excerpt,
            status,
            published_at,
            view_count
          )
        `
        )
        .eq('category_id', id);

      response.articles = (articleCategories || [])
        .map((ac: any) => ac.article)
        .filter((article: any) => article.status === 'published');
    }

    // Get parent category if exists
    if (category.parent_id) {
      const { data: parent } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('id', category.parent_id)
        .single();

      response.parent = parent;
    }

    // Get subcategories
    const { data: subcategories } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', id)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    response.subcategories = subcategories || [];

    return NextResponse.json(response);
  } catch (error) {
    console.error('Category API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
