import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { CategoryInsert } from '@/lib/types/database';

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

/**
 * POST /api/categories
 * Create a new category (admin only)
 */
export async function POST(request: NextRequest) {
  try {
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
    const { name, slug, description, parent_id, sort_order } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Validate slug format (lowercase, alphanumeric with hyphens)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must be lowercase alphanumeric with hyphens only' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this slug already exists' },
        { status: 409 }
      );
    }

    // Validate parent_id and depth if parent is specified
    if (parent_id) {
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

      // Calculate depth by traversing parent chain
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
    }

    // Create category
    const categoryData: CategoryInsert = {
      name,
      slug,
      description: description || null,
      parent_id: parent_id || null,
      sort_order: sort_order || 0,
    };

    const { data: newCategory, error: insertError } = await supabase
      .from('categories')
      .insert(categoryData)
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create category:', insertError);
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: newCategory, message: 'Category created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Categories POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
