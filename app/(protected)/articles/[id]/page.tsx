import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ArticleView } from '@/components/articles/article-view';
import Breadcrumbs, { buildCategoryBreadcrumbs } from '@/components/navigation/breadcrumbs';
import type { ArticleWithRelations, Category } from '@/lib/types/database';

interface ArticlePageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Fetch category hierarchy for a given category
 * Returns array of categories from root to the given category
 */
async function getCategoryHierarchy(categoryId: string): Promise<Category[]> {
  const supabase = await createClient();
  const hierarchy: Category[] = [];
  let currentId: string | null = categoryId;

  while (currentId) {
    const { data: category, error }: { data: Category | null; error: any } = await supabase
      .from('categories')
      .select('*')
      .eq('id', currentId)
      .single();

    if (error || !category) break;

    hierarchy.unshift(category);
    currentId = category.parent_id;
  }

  return hierarchy;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    .eq('status', 'published')
    .single();

  if (error || !article) {
    notFound();
  }

  // Fetch author profile separately
  const { data: author } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('id', article.author_id)
    .single();

  // Transform the nested categories structure
  const articleWithRelations: ArticleWithRelations = {
    ...article,
    author: author || null,
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

  // Build breadcrumbs from the first category (if any)
  // If article has multiple categories, we use the first one for breadcrumb navigation
  let breadcrumbItems = [];
  if (articleWithRelations.categories.length > 0) {
    const primaryCategory = articleWithRelations.categories[0];
    const categoryHierarchy = await getCategoryHierarchy(primaryCategory.id);
    breadcrumbItems = buildCategoryBreadcrumbs(categoryHierarchy, {
      label: article.title,
    });
  } else {
    // No categories, just show article title
    breadcrumbItems = [{ label: article.title }];
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Breadcrumbs items={breadcrumbItems} />
      <ArticleView article={articleWithRelations} currentUserId={user?.id} />
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
