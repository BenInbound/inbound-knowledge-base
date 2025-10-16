import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createArticleSchema } from '@/lib/validation/schemas';
import { slugify } from '@/lib/utils/helpers';
import type { ArticleInsert } from '@/lib/types/database';

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
    const authorIds = Array.from(new Set(data.map((a: any) => a.author_id)));
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    // Validate with Zod schema
    const validationResult = createArticleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { title, slug, content, excerpt, status, category_ids } = validationResult.data;

    // Generate slug if not provided
    const finalSlug = slug || slugify(title);

    // Check for slug uniqueness
    const { data: existingArticle } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', finalSlug)
      .single();

    if (existingArticle) {
      // Add a number suffix to make it unique
      const timestamp = Date.now();
      const uniqueSlug = `${finalSlug}-${timestamp}`;

      const { data: checkUnique } = await supabase
        .from('articles')
        .select('id')
        .eq('slug', uniqueSlug)
        .single();

      if (checkUnique) {
        return NextResponse.json(
          { error: 'Could not generate unique slug. Please try a different title.' },
          { status: 409 }
        );
      }

      // Use unique slug
      const articleData: ArticleInsert = {
        title,
        slug: uniqueSlug,
        content,
        excerpt: excerpt || null,
        status: status || 'draft',
        author_id: user.id,
        published_at: status === 'published' ? new Date().toISOString() : null,
        import_metadata: null,
      };

      const { data: article, error: insertError } = await supabase
        .from('articles')
        .insert(articleData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating article:', insertError);
        return NextResponse.json(
          { error: 'Failed to create article', details: insertError.message },
          { status: 500 }
        );
      }

      // Insert article-category relationships
      if (category_ids && category_ids.length > 0 && article) {
        const articleCategories = category_ids.map((category_id) => ({
          article_id: article.id,
          category_id,
        }));

        const { error: categoryError } = await supabase
          .from('article_categories')
          .insert(articleCategories);

        if (categoryError) {
          console.error('Error linking categories:', categoryError);
          // Don't fail the request, just log the error
        }
      }

      return NextResponse.json(
        {
          data: article,
          message: status === 'published' ? 'Article published successfully' : 'Article draft saved',
        },
        { status: 201 }
      );
    }

    // Prepare article data for insertion
    const articleData: ArticleInsert = {
      title,
      slug: finalSlug,
      content,
      excerpt: excerpt || null,
      status: status || 'draft',
      author_id: user.id,
      published_at: status === 'published' ? new Date().toISOString() : null,
      import_metadata: null,
    };

    // Insert article
    const { data: article, error: insertError } = await supabase
      .from('articles')
      .insert(articleData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating article:', insertError);
      return NextResponse.json(
        { error: 'Failed to create article', details: insertError.message },
        { status: 500 }
      );
    }

    // Insert article-category relationships
    if (category_ids && category_ids.length > 0 && article) {
      const articleCategories = category_ids.map((category_id) => ({
        article_id: article.id,
        category_id,
      }));

      const { error: categoryError } = await supabase
        .from('article_categories')
        .insert(articleCategories);

      if (categoryError) {
        console.error('Error linking categories:', categoryError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json(
      {
        data: article,
        message: status === 'published' ? 'Article published successfully' : 'Article draft saved',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Articles POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
