import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { updateArticleSchema } from '@/lib/validation/schemas';
import type { ArticleUpdate } from '@/lib/types/database';
import { deleteArticleImages } from '@/lib/storage/image-upload';

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

    // Fetch article with categories
    const { data: article, error } = await supabase
      .from('articles')
      .select(
        `
        *,
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

    // Fetch author profile separately
    const { data: author } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role')
      .eq('id', article.author_id)
      .single();

    // Transform the nested categories structure
    const response = {
      ...article,
      author: author || null,
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
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Fetch the existing article to check permissions
    const { data: existingArticle, error: fetchError } = await supabase
      .from('articles')
      .select('id, author_id, status, published_at')
      .eq('id', id)
      .single();

    if (fetchError || !existingArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Fetch user's profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Permission check: Author or admin can edit the article
    const isAuthor = existingArticle.author_id === user.id;
    const isAdmin = profile?.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Only the author or an admin can edit this article' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    // Validate with Zod schema
    const validationResult = updateArticleSchema.safeParse(body);

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

    // Server-side validation: Published articles must have at least one category
    if (status === 'published') {
      // If category_ids is provided and empty, reject
      if (category_ids !== undefined && category_ids.length === 0) {
        return NextResponse.json(
          { error: 'Published articles must have at least one category' },
          { status: 400 }
        );
      }

      // If category_ids is not provided, check existing categories
      if (category_ids === undefined) {
        const { data: existingCategories } = await supabase
          .from('article_categories')
          .select('category_id')
          .eq('article_id', id);

        if (!existingCategories || existingCategories.length === 0) {
          return NextResponse.json(
            { error: 'Published articles must have at least one category. Please select categories before publishing.' },
            { status: 400 }
          );
        }
      }
    }

    // Prepare article update data
    const updateData: ArticleUpdate = {
      updated_at: new Date().toISOString(),
    };

    // Only include fields that are provided
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (content !== undefined) {
      // Ensure content has the required structure for ArticleContent type
      updateData.content = {
        type: 'doc',
        content: content.content || [],
      };
    }
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (status !== undefined) {
      updateData.status = status;
      // If changing from draft to published, set published_at
      if (status === 'published' && existingArticle.status !== 'published') {
        updateData.published_at = new Date().toISOString();
      }
      // If unpublishing (published -> draft/archived), clear published_at
      if (status !== 'published' && existingArticle.status === 'published') {
        updateData.published_at = null;
      }
    }

    // Update the article
    const { data: article, error: updateError } = await supabase
      .from('articles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating article:', updateError);
      return NextResponse.json(
        { error: 'Failed to update article', details: updateError.message },
        { status: 500 }
      );
    }

    // Update article-category relationships if provided
    if (category_ids !== undefined) {
      // Delete existing relationships
      const { error: deleteError } = await supabase
        .from('article_categories')
        .delete()
        .eq('article_id', id);

      if (deleteError) {
        console.error('Error deleting article categories:', deleteError);
      }

      // Insert new relationships
      if (category_ids.length > 0) {
        const articleCategories = category_ids.map((category_id) => ({
          article_id: id,
          category_id,
        }));

        const { error: insertError } = await supabase
          .from('article_categories')
          .insert(articleCategories);

        if (insertError) {
          console.error('Error linking categories:', insertError);
          // Don't fail the request, just log the error
        }
      }
    }

    return NextResponse.json(
      {
        data: article,
        message:
          status === 'published'
            ? 'Article updated and published'
            : 'Article updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Article PATCH API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Fetch the existing article to check permissions
    const { data: existingArticle, error: fetchError } = await supabase
      .from('articles')
      .select('id, author_id, title')
      .eq('id', id)
      .single();

    if (fetchError || !existingArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Fetch user's profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Permission check: Author or admin can delete the article
    const isAuthor = existingArticle.author_id === user.id;
    const isAdmin = profile?.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Only the author or an admin can delete this article' },
        { status: 403 }
      );
    }

    // Clean up article images from storage before deleting the article
    // This replaces the previous database trigger approach which doesn't work on remote Supabase
    await deleteArticleImages(id, supabase);

    // Delete the article from database
    const { error: deleteError } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting article:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete article', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Article deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Article DELETE API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
