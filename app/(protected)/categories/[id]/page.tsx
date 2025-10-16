import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileText, FolderOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Category, ArticleListItem, CategoryTreeNode } from '@/lib/types/database';
import Breadcrumbs, { buildCategoryBreadcrumbs } from '@/components/navigation/breadcrumbs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils/helpers';
import CategoryCard from '@/components/categories/category-card';

interface CategoryPageProps {
  params: {
    id: string;
  };
}

/**
 * Fetch category by ID
 */
async function getCategory(id: string): Promise<Category | null> {
  const supabase = await createClient();

  const { data: category, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching category:', error);
    return null;
  }

  return category;
}

/**
 * Fetch category hierarchy (parents)
 */
async function getCategoryHierarchy(categoryId: string): Promise<Category[]> {
  const supabase = await createClient();
  const hierarchy: Category[] = [];
  let currentId: string | null = categoryId;

  while (currentId) {
    const result: { data: Category | null; error: any } = await supabase
      .from('categories')
      .select('*')
      .eq('id', currentId)
      .single();

    if (result.error || !result.data) break;

    hierarchy.unshift(result.data);
    currentId = result.data.parent_id;
  }

  return hierarchy;
}

/**
 * Fetch subcategories
 */
async function getSubcategories(parentId: string): Promise<CategoryTreeNode[]> {
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from('categories')
    .select(`
      *,
      article_categories(count)
    `)
    .eq('parent_id', parentId)
    .order('sort_order');

  if (error) {
    console.error('Error fetching subcategories:', error);
    return [];
  }

  // Map to CategoryTreeNode format
  return (categories || []).map((cat) => ({
    ...cat,
    children: [],
    article_count: cat.article_categories?.[0]?.count || 0,
    depth: 0,
    subcategory_count: 0,
  }));
}

/**
 * Fetch articles in category
 */
async function getCategoryArticles(categoryId: string): Promise<ArticleListItem[]> {
  const supabase = await createClient();

  // First, get article IDs for this category
  const { data: articleCategories, error: acError } = await supabase
    .from('article_categories')
    .select('article_id')
    .eq('category_id', categoryId);

  console.log('getCategoryArticles - categoryId:', categoryId);
  console.log('getCategoryArticles - articleCategories:', articleCategories);
  console.log('getCategoryArticles - error:', acError);

  if (acError) {
    console.error('Error fetching article categories:', acError);
    return [];
  }

  if (!articleCategories || articleCategories.length === 0) {
    console.log('getCategoryArticles - no article categories found');
    return [];
  }

  const articleIds = articleCategories.map(ac => ac.article_id);
  console.log('getCategoryArticles - articleIds:', articleIds);

  // Then fetch the articles
  const { data: articles, error } = await supabase
    .from('articles')
    .select(`
      id,
      title,
      slug,
      excerpt,
      status,
      author_id,
      published_at,
      created_at,
      updated_at,
      view_count,
      profiles!articles_author_id_fkey(full_name)
    `)
    .eq('status', 'published')
    .in('id', articleIds)
    .order('published_at', { ascending: false })
    .limit(20);

  console.log('getCategoryArticles - articles result:', articles);
  console.log('getCategoryArticles - articles error:', error);

  if (error) {
    console.error('Error fetching articles:', error);
    return [];
  }

  // Map to ArticleListItem format
  return (articles || []).map((article) => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    status: article.status,
    author_id: article.author_id,
    author_name: (article.profiles as any)?.full_name || 'Unknown',
    published_at: article.published_at,
    created_at: article.created_at,
    updated_at: article.updated_at,
    view_count: article.view_count,
    category_count: 0,
  }));
}

/**
 * Category detail page
 * Shows category info, subcategories, and articles
 */
export default async function CategoryPage({ params }: CategoryPageProps) {
  const { id } = params;

  const [category, hierarchy, subcategories, articles] = await Promise.all([
    getCategory(id),
    getCategoryHierarchy(id),
    getSubcategories(id),
    getCategoryArticles(id),
  ]);

  if (!category) {
    notFound();
  }

  // Build breadcrumbs (exclude current category from hierarchy)
  const breadcrumbItems = buildCategoryBreadcrumbs(
    hierarchy.slice(0, -1),
    { label: category.name }
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* Category Header */}
      <div className="border-b border-primary-200 pb-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
            <FolderOpen className="w-8 h-8 text-primary-700" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-primary-900 mb-2">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-primary-600">{category.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm text-primary-600">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>{articles.length} article{articles.length === 1 ? '' : 's'}</span>
          </div>
          {subcategories.length > 0 && (
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              <span>{subcategories.length} subcategor{subcategories.length === 1 ? 'y' : 'ies'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Subcategories Section */}
      {subcategories.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-primary-900 mb-6">Subcategories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subcategories.map((subcat) => (
              <CategoryCard key={subcat.id} category={subcat} />
            ))}
          </div>
        </section>
      )}

      {/* Articles Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary-900">Articles</h2>
          <Link href="/articles/new">
            <Button size="sm">New Article</Button>
          </Link>
        </div>

        {articles.length > 0 ? (
          <div className="space-y-4">
            {articles.map((article) => (
              <Link key={article.id} href={`/articles/${article.id}`}>
                <Card className="p-6 hover:shadow-lg hover:border-primary-300 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-primary-900 group-hover:text-primary-700 transition-colors mb-2">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-sm text-primary-600 line-clamp-2 mb-3">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-primary-500">
                        <span>By {article.author_name}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(article.published_at || article.created_at)}</span>
                        <span>•</span>
                        <span>{article.view_count} views</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-primary-900 mb-2">
              No articles yet
            </h3>
            <p className="text-sm text-primary-600 max-w-md mb-4">
              This category doesn't have any articles yet. Be the first to contribute!
            </p>
            <Link href="/articles/new">
              <Button>Create Article</Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
