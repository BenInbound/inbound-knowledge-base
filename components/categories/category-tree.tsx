"use client";

import { useState } from 'react';
import { ChevronRight, ChevronDown, FolderOpen, Folder, Edit, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Category, CategoryTreeNode } from '@/lib/types/database';
import { cn } from '@/lib/utils/helpers';

interface CategoryTreeProps {
  categories: Category[];
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  onReorder?: (categoryId: string, newSortOrder: number, newParentId: string | null) => void;
  showActions?: boolean;
}

/**
 * Category tree view component with hierarchical display
 * Supports expand/collapse, edit, and delete actions
 */
export default function CategoryTree({
  categories,
  onEdit,
  onDelete,
  onReorder,
  showActions = true,
}: CategoryTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Build tree structure from flat category list
  const buildTree = (parentId: string | null = null, depth: number = 0): CategoryTreeNode[] => {
    return categories
      .filter(cat => cat.parent_id === parentId)
      .sort((a, b) => {
        // Sort by sort_order first, then by name
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order;
        }
        return a.name.localeCompare(b.name);
      })
      .map(cat => {
        // Count articles in this category (placeholder - would come from API)
        const article_count = 0;

        return {
          ...cat,
          children: buildTree(cat.id, depth + 1),
          article_count,
          depth,
        };
      });
  };

  const tree = buildTree();

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const expandAll = () => {
    const allIds = categories.map(c => c.id);
    setExpandedIds(new Set(allIds));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const renderNode = (node: CategoryTreeNode) => {
    const isExpanded = expandedIds.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="select-none">
        {/* Node Row */}
        <div
          className={cn(
            "group flex items-center gap-2 py-2 px-3 rounded-md hover:bg-primary-50 transition-colors",
            node.depth === 0 && "font-semibold"
          )}
          style={{ paddingLeft: `${node.depth * 24 + 12}px` }}
        >
          {/* Drag Handle */}
          {showActions && onReorder && (
            <div className="cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-4 h-4 text-primary-400" />
            </div>
          )}

          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(node.id)}
              className="p-0.5 hover:bg-primary-100 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-primary-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-primary-600" />
              )}
            </button>
          ) : (
            <span className="w-5" /> // Spacer for alignment
          )}

          {/* Folder Icon */}
          {hasChildren && isExpanded ? (
            <FolderOpen className="w-5 h-5 text-primary-500" />
          ) : (
            <Folder className="w-5 h-5 text-primary-400" />
          )}

          {/* Category Name */}
          <div className="flex-1 min-w-0">
            <span className="text-sm text-primary-900 truncate">{node.name}</span>
            {node.description && (
              <p className="text-xs text-primary-600 truncate mt-0.5">
                {node.description}
              </p>
            )}
          </div>

          {/* Article Count */}
          <span className="text-xs text-primary-600 bg-primary-100 px-2 py-1 rounded-full">
            {node.article_count}
          </span>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onEdit(node)}
                  title="Edit category"
                  className="h-8 w-8"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDelete(node)}
                  title="Delete category"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
          <Folder className="w-8 h-8 text-primary-400" />
        </div>
        <h3 className="text-lg font-semibold text-primary-900 mb-2">
          No categories yet
        </h3>
        <p className="text-sm text-primary-600 max-w-md">
          Create your first category to start organizing content.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Expand/Collapse Controls */}
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={expandAll}
        >
          Expand All
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={collapseAll}
        >
          Collapse All
        </Button>
      </div>

      {/* Tree */}
      <div className="border border-primary-200 rounded-lg bg-white">
        <div className="divide-y divide-primary-100">
          {tree.map(node => renderNode(node))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-between text-sm text-primary-600">
        <span>{categories.length} {categories.length === 1 ? 'category' : 'categories'} total</span>
        <span>{tree.length} root {tree.length === 1 ? 'category' : 'categories'}</span>
      </div>
    </div>
  );
}
