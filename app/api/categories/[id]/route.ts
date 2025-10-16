import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { CategoryUpdate } from '@/lib/types/database';

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

/**
 * PATCH /api/categories/[id]
 * Update a category (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
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

    // Check if category exists
    const { data: existingCategory, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, slug, description, parent_id, sort_order } = body;

    // Build update object
    const updateData: CategoryUpdate = {};

    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) {
      // Validate slug format
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(slug)) {
        return NextResponse.json(
          { error: 'Slug must be lowercase alphanumeric with hyphens only' },
          { status: 400 }
        );
      }

      // Check if slug already exists (excluding current category)
      const { data: slugCheck } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .single();

      if (slugCheck) {
        return NextResponse.json(
          { error: 'A category with this slug already exists' },
          { status: 409 }
        );
      }

      updateData.slug = slug;
    }

    if (description !== undefined) updateData.description = description || null;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    // Handle parent_id changes
    if (parent_id !== undefined) {
      if (parent_id === null || parent_id === '') {
        // Moving to root
        updateData.parent_id = null;
      } else {
        // Check if parent exists
        const { data: parentCategory, error: parentError } = await supabase
          .from('categories')
          .select('id, parent_id')
          .eq('id', parent_id)
          .single();

        if (parentError || !parentCategory) {
          return NextResponse.json(
            { error: 'Parent category not found' },
            { status: 400 }
          );
        }

        // Prevent circular reference (can't be its own parent or descendant)
        if (parent_id === id) {
          return NextResponse.json(
            { error: 'Category cannot be its own parent' },
            { status: 400 }
          );
        }

        // Check if the new parent is a descendant of this category
        let checkParentId: string | null = parent_id;
        while (checkParentId) {
          if (checkParentId === id) {
            return NextResponse.json(
              { error: 'Cannot move category to its own descendant' },
              { status: 400 }
            );
          }

          const { data: ancestor } = await supabase
            .from('categories')
            .select('parent_id')
            .eq('id', checkParentId)
            .single();

          checkParentId = ancestor?.parent_id || null;
        }

        // Calculate depth with new parent
        let depth = 1;
        let currentParentId = parentCategory.parent_id;

        while (currentParentId && depth < 3) {
          const { data: ancestor } = await supabase
            .from('categories')
            .select('parent_id')
            .eq('id', currentParentId)
            .single();

          if (ancestor) {
            currentParentId = ancestor.parent_id;
            depth++;
          } else {
            break;
          }
        }

        // Maximum depth is 3 (root -> level 1 -> level 2)
        if (depth >= 2) {
          return NextResponse.json(
            { error: 'Maximum category nesting depth (3 levels) would be exceeded' },
            { status: 400 }
          );
        }

        updateData.parent_id = parent_id;
      }
    }

    // Update category
    const { data: updatedCategory, error: updateError } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update category:', updateError);
      return NextResponse.json(
        { error: 'Failed to update category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: updatedCategory,
      message: 'Category updated successfully',
    });
  } catch (error) {
    console.error('Category PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories/[id]
 * Delete a category (admin only)
 * Checks if category has articles before deleting
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
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

    // Check if category exists
    const { data: category, error: fetchError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('id', id)
      .single();

    if (fetchError || !category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has articles
    const { count: articleCount } = await supabase
      .from('article_categories')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    if (articleCount && articleCount > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete category with articles',
          details: `This category contains ${articleCount} ${
            articleCount === 1 ? 'article' : 'articles'
          }. Please move or delete the articles first.`,
          article_count: articleCount,
        },
        { status: 409 }
      );
    }

    // Check if category has subcategories
    const { count: subcategoryCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', id);

    if (subcategoryCount && subcategoryCount > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete category with subcategories',
          details: `This category contains ${subcategoryCount} ${
            subcategoryCount === 1 ? 'subcategory' : 'subcategories'
          }. Please move or delete the subcategories first.`,
          subcategory_count: subcategoryCount,
        },
        { status: 409 }
      );
    }

    // Delete category
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Failed to delete category:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Category DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
