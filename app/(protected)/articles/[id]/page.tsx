import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ArticleView } from '@/components/articles/article-view';
import type { ArticleWithRelations } from '@/lib/types/database';

interface ArticlePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
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
        avatar_url
      ),
      categories:article_categories(
        category:categories(*)
      )
    `
    )
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (error || !article) {
    notFound();
  }

  // Transform the nested categories structure
  const articleWithRelations: ArticleWithRelations = {
    ...article,
    author: article.author,
    categories: article.categories.map((ac: any) => ac.category),
  };

  // Increment view count (fire and forget)
  supabase
    .from('articles')
    .update({ view_count: article.view_count + 1 })
    .eq('id', id)
    .then(() => {
      // View count updated
    });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ArticleView article={articleWithRelations} />
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ArticlePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: article } = await supabase
    .from('articles')
    .select('title, excerpt')
    .eq('id', id)
    .single();

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    title: article.title,
    description: article.excerpt || undefined,
  };
}
