import Link from 'next/link';
import { FolderOpen, ChevronRight, ChevronDown, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { CategoryTreeNode } from '@/lib/types/database';

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
 * Recursive category tree item component
 */
function CategoryTreeItem({ category }: { category: CategoryTreeNode }) {
  const hasChildren = category.children.length > 0;
  const indent = category.depth * 16; // 16px per level

  return (
    <li>
      <Link
        href={`/categories/${category.id}`}
        className="flex items-center gap-2 px-3 py-2 text-sm text-primary-700 hover:bg-primary-100 hover:text-primary-900 rounded-md transition-colors group"
        style={{ paddingLeft: `${12 + indent}px` }}
      >
        {hasChildren ? (
          <ChevronRight className="h-4 w-4 text-primary-400 group-hover:text-primary-600 flex-shrink-0" />
        ) : (
          <div className="h-4 w-4 flex-shrink-0" /> // Spacer for alignment
        )}
        <FolderOpen className="h-4 w-4 text-primary-500 flex-shrink-0" />
        <span className="flex-1 truncate font-medium">{category.name}</span>
        {category.article_count > 0 && (
          <span className="text-xs text-primary-500 bg-primary-100 px-2 py-0.5 rounded-full">
            {category.article_count}
          </span>
        )}
      </Link>

      {hasChildren && (
        <ul className="space-y-1">
          {category.children.map((child) => (
            <CategoryTreeItem key={child.id} category={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Sidebar component with category navigation
 */
export default async function Sidebar() {
  const categories = await getCategories();

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-primary-200 p-4">
      <div className="space-y-6">
        {/* Categories Section */}
        <div>
          <h2 className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-3 px-3">
            Categories
          </h2>

          {categories.length > 0 ? (
            <nav>
              <ul className="space-y-1">
                {categories.map((category) => (
                  <CategoryTreeItem key={category.id} category={category} />
                ))}
              </ul>
            </nav>
          ) : (
            <div className="px-3 py-6 text-center text-sm text-primary-500">
              <FolderOpen className="h-8 w-8 mx-auto mb-2 text-primary-300" />
              <p>No categories yet</p>
            </div>
          )}
        </div>

        {/* Quick Links Section */}
        <div className="pt-6 border-t border-primary-200">
          <h2 className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-3 px-3">
            Quick Links
          </h2>
          <nav>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/articles"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-primary-700 hover:bg-primary-100 hover:text-primary-900 rounded-md transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>All Articles</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/articles/new"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-primary-700 hover:bg-primary-100 hover:text-primary-900 rounded-md transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>My Drafts</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </aside>
  );
}
