import { FolderOpen } from 'lucide-react';
import type { CategoryWithCount } from '@/lib/types/database';
import CategoryCard from './category-card';

interface CategoryListProps {
  categories: CategoryWithCount[];
  emptyMessage?: string;
}

/**
 * Category list component
 * Displays a grid of category cards or empty state
 */
export default function CategoryList({
  categories,
  emptyMessage = "No categories found"
}: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
          <FolderOpen className="w-8 h-8 text-primary-400" />
        </div>
        <h3 className="text-lg font-semibold text-primary-900 mb-2">
          {emptyMessage}
        </h3>
        <p className="text-sm text-primary-600 max-w-md">
          Categories help organize content and make it easier to find what you&apos;re looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}
