import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ArticleForm } from '@/components/articles/article-form';
import type { Category, Article } from '@/lib/types/database';

interface EditArticlePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Edit Article | Internal Knowledge Base',
  description: 'Edit an existing article',
};

async function getArticle(id: string, userId: string) {
  const supabase = await createClient();

  // Fetch the article
  const { data: article, error } = await supabase
    .from('articles')
    .select(
      `
      *,
      categories:article_categories(
        category_id
      )
    `
    )
    .eq('id', id)
    .single();

  if (error || !article) {
    return null;
  }

  // Check if the current user is the author
  if (article.author_id !== userId) {
    return null;
  }

  // Extract category IDs
  const category_ids = article.categories.map((ac: any) => ac.category_id);

  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    content: article.content,
    excerpt: article.excerpt,
    status: article.status,
    category_ids,
  };
}

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

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const article = await getArticle(id, user.id);

  // If article not found or user is not the author, show 404
  if (!article) {
    notFound();
  }

  const categories = await getCategories();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Article</h1>
        <p className="text-gray-600 mt-2">
          Make changes to your article and save or publish when ready.
        </p>
      </div>

      <ArticleForm
        userId={user.id}
        initialData={article}
        categories={categories}
        autoSave={true}
      />
    </div>
  );
}
