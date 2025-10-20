/**
 * Admin Cleanup API
 * Deletes all articles and optionally categories
 * Admin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { deleteCategories = false } = body;

    // Delete articles
    const { error: articlesError } = await supabase
      .from('articles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (articlesError) {
      throw new Error(`Failed to delete articles: ${articlesError.message}`);
    }

    // Delete categories if requested
    if (deleteCategories) {
      const { error: categoriesError } = await supabase
        .from('categories')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (categoriesError) {
        throw new Error(`Failed to delete categories: ${categoriesError.message}`);
      }
    }

    // Count remaining
    const { count: articlesCount } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });

    const { count: categoriesCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed',
      articlesDeleted: true,
      categoriesDeleted: deleteCategories,
      remaining: {
        articles: articlesCount || 0,
        categories: categoriesCount || 0,
      },
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      {
        error: 'Cleanup failed',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
