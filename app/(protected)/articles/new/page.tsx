import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ArticleForm } from '@/components/articles/article-form';
import type { Category } from '@/lib/types/database';

export const metadata = {
  title: 'Create New Article | Internal Knowledge Base',
  description: 'Create a new article for the knowledge base',
};

async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data || [];
}

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export default async function NewArticlePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const categories = await getCategories();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Article</h1>
        <p className="text-gray-600 mt-2">
          Share your knowledge with the team by creating a new article.
        </p>
      </div>

      <ArticleForm userId={user.id} categories={categories} autoSave={false} />
    </div>
  );
}
