import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CategoryManagementClient from './category-management-client';

/**
 * Category Management Page (Admin Only)
 * Allows admins to create, edit, and delete categories
 */
export default async function CategoryManagementPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/'); // Redirect non-admins to home
  }

  // Fetch all categories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (categoriesError) {
    console.error('Failed to fetch categories:', categoriesError);
  }

  // Fetch article counts for each category
  const categoriesWithCount = await Promise.all(
    (categories || []).map(async (category) => {
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

  return (
    <CategoryManagementClient
      initialCategories={categoriesWithCount}
    />
  );
}
