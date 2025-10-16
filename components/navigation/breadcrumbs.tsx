import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string; // Optional: if omitted, renders as text only (current page)
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumb navigation component
 * Displays hierarchical navigation path
 *
 * @example
 * <Breadcrumbs items={[
 *   { label: 'Home', href: '/' },
 *   { label: 'Engineering', href: '/categories/engineering' },
 *   { label: 'Backend', href: '/categories/backend' },
 *   { label: 'API Guidelines' } // Current page (no href)
 * ]} />
 */
export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 text-sm text-primary-600">
        {/* Home link */}
        <li>
          <Link
            href="/"
            className="flex items-center hover:text-primary-900 transition-colors"
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>

        {/* Breadcrumb items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isClickable = !isLast && item.href;

          return (
            <li key={index} className="flex items-center gap-2">
              {/* Separator */}
              <ChevronRight className="h-4 w-4 text-primary-400" />

              {/* Breadcrumb item */}
              {isClickable ? (
                <Link
                  href={item.href!}
                  className="hover:text-primary-900 transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast
                      ? 'font-semibold text-primary-900'
                      : 'font-medium'
                  }
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Utility function to build breadcrumbs from category hierarchy
 * Used on article and category pages
 */
export function buildCategoryBreadcrumbs(
  categories: Array<{ id: string; name: string; slug: string }>,
  currentItem?: { label: string; href?: string }
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = categories.map((cat) => ({
    label: cat.name,
    href: `/categories/${cat.id}`,
  }));

  if (currentItem) {
    items.push(currentItem);
  }

  return items;
}
