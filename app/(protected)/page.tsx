import Link from 'next/link';
import { FileText, TrendingUp, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { CategoryWithCount, ArticleListItem } from '@/lib/types/database';
import CategoryList from '@/components/categories/category-list';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils/helpers';

/**
 * Fetch root categories with article counts
 */
async function getRootCategories(): Promise<CategoryWithCount[]> {
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from('categories')
    .select(`
      *,
      article_categories(count)
    `)
    .is('parent_id', null)
    .order('sort_order');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  // Map article counts and fetch subcategory counts
  const categoriesWithCounts = await Promise.all(
    (categories || []).map(async (cat) => {
      const { count: subcategoryCount } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', cat.id);

      return {
        ...cat,
        article_count: cat.article_categories?.[0]?.count || 0,
        subcategory_count: subcategoryCount || 0,
      };
    })
  );

  return categoriesWithCounts;
}

/**
 * Fetch recent articles
 */
async function getRecentArticles(): Promise<ArticleListItem[]> {
  const supabase = await createClient();

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
      view_count
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(5);

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
    category_count: 0, // Not fetched for home page
  }));
}

/**
 * Get total article count
 */
async function getArticleCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  if (error) {
    console.error('Error fetching article count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Home/Dashboard page
 * Shows categories, recent articles, and quick stats
 */
export default async function HomePage() {
  const [categories, recentArticles, articleCount] = await Promise.all([
    getRootCategories(),
    getRecentArticles(),
    getArticleCount(),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="border-b border-primary-200 pb-6">
        <h1 className="text-3xl font-bold text-primary-900 mb-2">
          Welcome to the Knowledge Base
        </h1>
        <p className="text-primary-600">
          Browse categories, search for content, or explore recent articles
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-900">{articleCount}</p>
              <p className="text-sm text-primary-600">Published Articles</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-900">{categories.length}</p>
              <p className="text-sm text-primary-600">Categories</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-900">{recentArticles.length}</p>
              <p className="text-sm text-primary-600">Recent Updates</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Categories Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary-900">Browse Categories</h2>
          <Link href="/categories">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>
        <CategoryList categories={categories} />
      </section>

      {/* Recent Articles Section */}
      {recentArticles.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-primary-900">Recent Articles</h2>
            <Link href="/articles">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>

          <div>
            {recentArticles.map((article, index) => (
              <div key={article.id} style={{ marginBottom: index === recentArticles.length - 1 ? 0 : '16px' }}>
                <Link href={`/articles/${article.id}`}>
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
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
