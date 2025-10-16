import { createClient } from '@/lib/supabase/server';
import type { CategoryTreeNode } from '@/lib/types/database';
import { SidebarClient } from './sidebar-client';

/**
 * Build hierarchical category tree from flat list
 */
function buildCategoryTree(categories: any[]): CategoryTreeNode[] {
  const categoryMap = new Map<string, CategoryTreeNode>();
  const rootCategories: CategoryTreeNode[] = [];

  // First pass: Create nodes
  categories.forEach((cat) => {
    categoryMap.set(cat.id, {
      ...cat,
      children: [],
      article_count: cat.article_count || 0,
      depth: 0,
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

  // Map article counts
  const categoriesWithCounts = categories?.map((cat) => ({
    ...cat,
    article_count: cat.article_categories?.[0]?.count || 0,
  })) || [];

  return buildCategoryTree(categoriesWithCounts);
}

/**
 * Sidebar component with category navigation (Server Component)
 */
export default async function Sidebar() {
  const categories = await getCategories();
  return <SidebarClient categories={categories} />;
}
