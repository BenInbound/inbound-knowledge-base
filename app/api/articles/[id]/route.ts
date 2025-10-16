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

    // Fetch article with author and categories
    const { data: article, error } = await supabase
      .from('articles')
      .select(
        `
        *,
        author:profiles!articles_author_id_fkey(
          id,
          full_name,
          avatar_url,
          role
        ),
        categories:article_categories(
          category:categories(*)
        )
      `
      )
      .eq('id', id)
      .single();

    if (error || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view this article
    // Published articles are visible to all authenticated users
    // Draft articles are only visible to the author
    if (article.status !== 'published') {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || user.id !== article.author_id) {
        return NextResponse.json(
          { error: 'Article not found' },
          { status: 404 }
        );
      }
    }

    // Transform the nested categories structure
    const response = {
      ...article,
      categories: article.categories.map((ac: any) => ac.category),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Article API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
