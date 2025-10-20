'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderOpen, ChevronRight, ChevronDown, FileText } from 'lucide-react';
import type { CategoryTreeNode } from '@/lib/types/database';

/**
 * Recursive category tree item component
 */
function CategoryTreeItem({ category }: { category: CategoryTreeNode }) {
  const pathname = usePathname();
  const hasChildren = category.children.length > 0;
  const indent = category.depth * 16; // 16px per level
  const isActive = pathname === `/categories/${category.id}`;
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed by default

  const toggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <li>
      <div className="flex items-center">
        <Link
          href={`/categories/${category.id}`}
          className={`flex items-start gap-2 px-3 py-2 text-sm rounded-md transition-colors group flex-1 ${
            isActive
              ? 'bg-primary-100 text-primary-900'
              : 'text-primary-700 hover:bg-primary-100 hover:text-primary-900'
          }`}
          style={{ paddingLeft: `${12 + indent}px` }}
        >
          {hasChildren ? (
            <button
              onClick={toggleExpanded}
              className="h-4 w-4 mt-0.5 flex-shrink-0 flex items-center justify-center hover:bg-primary-200 rounded"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-primary-400 group-hover:text-primary-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-primary-400 group-hover:text-primary-600" />
              )}
            </button>
          ) : (
            <div className="h-4 w-4 mt-0.5 flex-shrink-0" /> // Spacer for alignment
          )}
          <FolderOpen className="h-4 w-4 mt-0.5 text-primary-500 flex-shrink-0" />
          <span className="flex-1 font-medium break-words">{category.name}</span>
          {category.article_count > 0 && (
            <span className="text-xs text-primary-500 bg-primary-100 px-2 py-0.5 rounded-full">
              {category.article_count}
            </span>
          )}
        </Link>
      </div>

      {hasChildren && isExpanded && (
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
 * Client-side sidebar content component
 */
export function SidebarClient({ categories }: { categories: CategoryTreeNode[] }) {
  const pathname = usePathname();

  return (
    <aside className="w-80 min-h-screen bg-white border-r border-primary-200 p-4">
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
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                    pathname === '/articles'
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-primary-700 hover:bg-primary-100 hover:text-primary-900'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>All Articles</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/articles/drafts"
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                    pathname === '/articles/drafts'
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-primary-700 hover:bg-primary-100 hover:text-primary-900'
                  }`}
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
