import Link from 'next/link';
import { FolderOpen, FileText, ChevronRight } from 'lucide-react';
import type { CategoryWithCount } from '@/lib/types/database';
import { Card } from '@/components/ui/card';
import { formatCompactNumber } from '@/lib/utils/helpers';

interface CategoryCardProps {
  category: CategoryWithCount;
}

/**
 * Category card component for displaying category information
 * Used in category lists and home page
 */
export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/categories/${category.id}`}>
      <Card className="p-6 hover:shadow-lg hover:border-primary-300 transition-all cursor-pointer group">
        <div className="flex items-start gap-4">
          {/* Category Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <FolderOpen className="w-6 h-6 text-primary-700" />
            </div>
          </div>

          {/* Category Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-lg font-semibold text-primary-900 group-hover:text-primary-700 transition-colors truncate">
                {category.name}
              </h3>
              <ChevronRight className="w-5 h-5 text-primary-400 group-hover:text-primary-600 transition-colors flex-shrink-0" />
            </div>

            {/* Description */}
            {category.description && (
              <p className="text-sm text-primary-600 line-clamp-2 mb-3">
                {category.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-primary-500">
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>
                  {category.article_count === 0
                    ? 'No articles'
                    : `${formatCompactNumber(category.article_count)} article${category.article_count === 1 ? '' : 's'}`}
                </span>
              </div>

              {category.subcategory_count && category.subcategory_count > 0 && (
                <div className="flex items-center gap-1">
                  <FolderOpen className="w-4 h-4" />
                  <span>
                    {formatCompactNumber(category.subcategory_count)} sub cat{category.subcategory_count === 1 ? '' : 's'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
