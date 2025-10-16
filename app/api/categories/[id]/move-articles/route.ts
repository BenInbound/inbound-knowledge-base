import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Helper function to check if user is admin
 */
async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return false;
  }

  return profile.role === 'admin';
}

/**
 * POST /api/categories/[id]/move-articles
 * Move all articles from one category to another (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: sourceCategoryId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminCheck = await isAdmin(supabase, user.id);
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { target_category_id } = body;

    if (!target_category_id) {
      return NextResponse.json(
        { error: 'Target category ID is required' },
        { status: 400 }
      );
    }

    // Validate that source and target are different
    if (sourceCategoryId === target_category_id) {
      return NextResponse.json(
        { error: 'Source and target categories must be different' },
        { status: 400 }
      );
    }

    // Check if source category exists
    const { data: sourceCategory, error: sourceFetchError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('id', sourceCategoryId)
      .single();

    if (sourceFetchError || !sourceCategory) {
      return NextResponse.json(
        { error: 'Source category not found' },
        { status: 404 }
      );
    }

    // Check if target category exists
    const { data: targetCategory, error: targetFetchError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('id', target_category_id)
      .single();

    if (targetFetchError || !targetCategory) {
      return NextResponse.json(
        { error: 'Target category not found' },
        { status: 404 }
      );
    }

    // Get all articles in the source category
    const { data: articleCategories, error: acError } = await supabase
      .from('article_categories')
      .select('article_id')
      .eq('category_id', sourceCategoryId);

    if (acError) {
      console.error('Error fetching article categories:', acError);
      return NextResponse.json(
        { error: 'Failed to fetch articles' },
        { status: 500 }
      );
    }

    if (!articleCategories || articleCategories.length === 0) {
      return NextResponse.json({
        message: 'No articles to move',
        moved_count: 0,
      });
    }

    const articleIds = articleCategories.map((ac) => ac.article_id);

    // Check if any articles already have the target category
    // If they do, we don't want to create duplicate relationships
    const { data: existingRelations } = await supabase
      .from('article_categories')
      .select('article_id')
      .eq('category_id', target_category_id)
      .in('article_id', articleIds);

    const existingArticleIds = new Set(
      (existingRelations || []).map((r) => r.article_id)
    );

    // Articles that need the target category added
    const articlesToAdd = articleIds.filter((id) => !existingArticleIds.has(id));

    // Delete all relationships with source category
    const { error: deleteError } = await supabase
      .from('article_categories')
      .delete()
      .eq('category_id', sourceCategoryId);

    if (deleteError) {
      console.error('Error deleting article categories:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove articles from source category' },
        { status: 500 }
      );
    }

    // Add relationships with target category (only for articles that don't already have it)
    if (articlesToAdd.length > 0) {
      const newRelations = articlesToAdd.map((article_id) => ({
        article_id,
        category_id: target_category_id,
      }));

      const { error: insertError } = await supabase
        .from('article_categories')
        .insert(newRelations);

      if (insertError) {
        console.error('Error adding article categories:', insertError);
        return NextResponse.json(
          { error: 'Failed to add articles to target category' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: `Successfully moved ${articleIds.length} ${
        articleIds.length === 1 ? 'article' : 'articles'
      } from "${sourceCategory.name}" to "${targetCategory.name}"`,
      moved_count: articleIds.length,
      source_category: sourceCategory.name,
      target_category: targetCategory.name,
    });
  } catch (error) {
    console.error('Move articles API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
