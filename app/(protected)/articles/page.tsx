import { Suspense } from 'react';
import Link from 'next/link';
import { FileText, Filter } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Category, ArticleListItem } from '@/lib/types/database';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils/helpers';
import ArticleFilters from '@/components/articles/article-filters';

interface ArticlesPageProps {
  searchParams: {
    category?: string;
    search?: string;
  };
}

/**
 * Fetch all categories for filter dropdown
 */
async function getAllCategories(): Promise<Category[]> {
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return categories || [];
}

/**
 * Fetch articles with optional category filter and search
 */
async function getArticles(
  categoryId?: string,
  searchQuery?: string
): Promise<ArticleListItem[]> {
  const supabase = await createClient();

  let articleIds: string[] | null = null;

  // Filter by category if specified
  if (categoryId) {
    const { data: articleCategories, error: acError } = await supabase
      .from('article_categories')
      .select('article_id')
      .eq('category_id', categoryId);

    if (acError) {
      console.error('Error fetching article categories:', acError);
      return [];
    }

    if (!articleCategories || articleCategories.length === 0) {
      return [];
    }

    articleIds = articleCategories.map(ac => ac.article_id);
  }

  // Build query
  let query = supabase
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
      view_count
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  // Apply category filter if we have article IDs
  if (articleIds) {
    query = query.in('id', articleIds);
  }

  // Apply search filter if specified
  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`);
  }

  const { data: articles, error } = await query;

  if (error) {
    console.error('Error fetching articles:', error);
    return [];
  }

  if (!articles || articles.length === 0) {
    return [];
  }

  // Fetch profiles for all authors
  const authorIds = Array.from(new Set(articles.map(a => a.author_id)));
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', authorIds);

  // Create a map of author_id -> full_name
  const authorMap = new Map(
    (profiles || []).map(p => [p.id, p.full_name])
  );

  // Fetch category counts for each article
  const { data: articleCategoryCounts } = await supabase
    .from('article_categories')
    .select('article_id')
    .in('article_id', articles.map(a => a.id));

  const categoryCountMap = new Map<string, number>();
  (articleCategoryCounts || []).forEach(ac => {
    categoryCountMap.set(ac.article_id, (categoryCountMap.get(ac.article_id) || 0) + 1);
  });

  // Map to ArticleListItem format
  return articles.map((article) => ({
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
    category_count: categoryCountMap.get(article.id) || 0,
  }));
}

/**
 * Articles list page with filtering
 */
export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const categoryId = searchParams.category;
  const searchQuery = searchParams.search;

  const [articles, categories] = await Promise.all([
    getArticles(categoryId, searchQuery),
    getAllCategories(),
  ]);

  // Find selected category name for display
  const selectedCategory = categoryId
    ? categories.find(c => c.id === categoryId)
    : null;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-primary-200 pb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-primary-900 mb-2">
              All Articles
            </h1>
            <p className="text-primary-600">
              {selectedCategory
                ? `Showing articles in "${selectedCategory.name}"`
                : searchQuery
                ? `Search results for "${searchQuery}"`
                : 'Browse all published articles'}
            </p>
          </div>
          <Link href="/articles/new">
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              New Article
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Suspense fallback={<div>Loading filters...</div>}>
          <ArticleFilters
            categories={categories}
            selectedCategoryId={categoryId}
            searchQuery={searchQuery}
          />
        </Suspense>
      </div>

      {/* Article Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-primary-600">
          {articles.length} article{articles.length === 1 ? '' : 's'} found
        </p>
        {(categoryId || searchQuery) && (
          <Link href="/articles">
            <Button variant="ghost" size="sm">
              Clear Filters
            </Button>
          </Link>
        )}
      </div>

      {/* Articles List */}
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
                      {article.category_count > 0 && (
                        <>
                          <span>•</span>
                          <span>{article.category_count} {article.category_count === 1 ? 'category' : 'categories'}</span>
                        </>
                      )}
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
            No articles found
          </h3>
          <p className="text-sm text-primary-600 max-w-md mb-4">
            {categoryId
              ? "This category doesn't have any articles yet."
              : searchQuery
              ? "Try adjusting your search query."
              : "No published articles available."}
          </p>
          <div className="flex gap-2">
            {(categoryId || searchQuery) && (
              <Link href="/articles">
                <Button variant="outline">Clear Filters</Button>
              </Link>
            )}
            <Link href="/articles/new">
              <Button>Create Article</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
