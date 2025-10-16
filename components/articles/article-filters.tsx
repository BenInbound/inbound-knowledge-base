"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { Category } from '@/lib/types/database';

interface ArticleFiltersProps {
  categories: Category[];
  selectedCategoryId?: string;
  searchQuery?: string;
}

/**
 * Article filters component with category dropdown and search
 */
export default function ArticleFilters({
  categories,
  selectedCategoryId,
  searchQuery,
}: ArticleFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categoryFilter, setCategoryFilter] = useState(selectedCategoryId || '');
  const [searchInput, setSearchInput] = useState(searchQuery || '');

  // Build hierarchical category list with indentation
  const buildCategoryOptions = () => {
    // Group categories by parent
    const categoryMap = new Map<string | null, Category[]>();
    categories.forEach(cat => {
      const parent = cat.parent_id;
      if (!categoryMap.has(parent)) {
        categoryMap.set(parent, []);
      }
      categoryMap.get(parent)!.push(cat);
    });

    // Recursively build sorted list with depth
    const buildList = (parentId: string | null = null, depth: number = 0): Category[] => {
      const children = categoryMap.get(parentId) || [];
      const sorted = children.sort((a, b) =>
        a.sort_order - b.sort_order || a.name.localeCompare(b.name)
      );

      const result: Category[] = [];
      sorted.forEach(cat => {
        result.push({ ...cat, depth } as Category & { depth: number });
        result.push(...buildList(cat.id, depth + 1));
      });

      return result;
    };

    return buildList();
  };

  const handleFilterChange = (newCategory: string, newSearch: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newCategory) {
      params.set('category', newCategory);
    } else {
      params.delete('category');
    }

    if (newSearch) {
      params.set('search', newSearch);
    } else {
      params.delete('search');
    }

    router.push(`/articles?${params.toString()}`);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    handleFilterChange(value, searchInput);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange(categoryFilter, searchInput);
  };

  const handleClearFilters = () => {
    setCategoryFilter('');
    setSearchInput('');
    router.push('/articles');
  };

  const hasActiveFilters = categoryFilter || searchInput;
  const hierarchicalCategories = buildCategoryOptions();

  return (
    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-primary-600" />
        <h3 className="text-sm font-semibold text-primary-900">Filters</h3>
      </div>

      <form onSubmit={handleSearchSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category Filter */}
          <div>
            <label htmlFor="category-filter" className="block text-xs font-medium text-primary-700 mb-1">
              Category
            </label>
            <Select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">All Categories</option>
              {hierarchicalCategories.map((cat) => {
                const depth = (cat as Category & { depth: number }).depth || 0;
                const indent = '\u00A0\u00A0'.repeat(depth);
                return (
                  <option key={cat.id} value={cat.id}>
                    {indent}{cat.name}
                  </option>
                );
              })}
            </Select>
          </div>

          {/* Search Filter */}
          <div>
            <label htmlFor="search-filter" className="block text-xs font-medium text-primary-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400" />
              <Input
                id="search-filter"
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search articles..."
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 justify-end">
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
          <Button type="submit" size="sm">
            Apply Filters
          </Button>
        </div>
      </form>
    </div>
  );
}
