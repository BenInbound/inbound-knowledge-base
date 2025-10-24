import { createClient } from '@/lib/supabase/server';
import type { CategoryTreeNode, SidebarArticle } from '@/lib/types/database';
import { SidebarClient } from './sidebar-client';

/**
 * Build hierarchical category tree from flat list
 */
function buildCategoryTree(categories: any[], articlesMap: Map<string, SidebarArticle[]>): CategoryTreeNode[] {
  const categoryMap = new Map<string, CategoryTreeNode>();
  const rootCategories: CategoryTreeNode[] = [];

  // First pass: Create nodes
  categories.forEach((cat) => {
    categoryMap.set(cat.id, {
      ...cat,
      children: [],
      article_count: cat.article_count || 0,
      depth: 0,
      articles: articlesMap.get(cat.id) || [],
    });
  });

  // Second pass: Build tree structure
  categories.forEach((cat) => {
    const node = categoryMap.get(cat.id)!;

    if (cat.parent_id) {
      const parent = categoryMap.get(cat.parent_id);
      if (parent) {
        node.depth = parent.depth + 1;
        parent.children.push(node);
      } else {
        // Parent not found, treat as root
        rootCategories.push(node);
      }
    } else {
      // Root category
      rootCategories.push(node);
    }
  });

  // Sort by sort_order
  const sortNodes = (nodes: CategoryTreeNode[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order);
    nodes.forEach((node) => {
      if (node.children.length > 0) {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(rootCategories);
  return rootCategories;
}

/**
 * Fetch categories from database with article counts
 */
async function getCategories(): Promise<CategoryTreeNode[]> {
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from('categories')
    .select(`
      *,
      article_categories(count)
    `)
    .order('sort_order');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  // Get current user and their role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    isAdmin = profile?.role === 'admin';
  }

  // Map article counts
  let categoriesWithCounts = categories?.map((cat) => ({
    ...cat,
    article_count: cat.article_categories?.[0]?.count || 0,
  })) || [];

  // Filter out "Papirkurv" category and its subcategories for non-admin users
  if (!isAdmin) {
    // Find the "Papirkurv" category ID
    const papirkurvCategory = categoriesWithCounts.find(
      (cat) => cat.name === 'Papirkurv'
    );

    if (papirkurvCategory) {
      // Recursively find all descendant category IDs
      const getDescendantIds = (parentId: string, categories: any[]): string[] => {
        const childIds = categories
          .filter((cat) => cat.parent_id === parentId)
          .map((cat) => cat.id);

        const descendantIds = [...childIds];
        childIds.forEach((childId) => {
          descendantIds.push(...getDescendantIds(childId, categories));
        });

        return descendantIds;
      };

      const excludeIds = new Set([
        papirkurvCategory.id,
        ...getDescendantIds(papirkurvCategory.id, categoriesWithCounts),
      ]);

      // Filter out "Papirkurv" and all its descendants
      categoriesWithCounts = categoriesWithCounts.filter(
        (cat) => !excludeIds.has(cat.id)
      );
    }
  }

  // Fetch all published articles with their categories
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, slug')
    .eq('status', 'published')
    .order('title');

  // Fetch article-category relationships
  const { data: articleCategories } = await supabase
    .from('article_categories')
    .select('article_id, category_id');

  // Build map of category_id -> articles
  const articlesMap = new Map<string, SidebarArticle[]>();

  if (articles && articleCategories) {
    // Create article lookup map
    const articleMap = new Map(articles.map(a => [a.id, a]));

    // Group articles by category
    articleCategories.forEach((ac) => {
      const article = articleMap.get(ac.article_id);
      if (article) {
        if (!articlesMap.has(ac.category_id)) {
          articlesMap.set(ac.category_id, []);
        }
        articlesMap.get(ac.category_id)!.push({
          id: article.id,
          title: article.title,
          slug: article.slug,
        });
      }
    });
  }

  return buildCategoryTree(categoriesWithCounts, articlesMap);
}

/**
 * Sidebar component with category navigation (Server Component)
 */
export default async function Sidebar() {
  const categories = await getCategories();
  return <SidebarClient categories={categories} />;
}
