/**
 * Validation for Imported Data
 * T149: Create validation for imported data against schemas
 * T150: Implement dry-run validation (check without inserting)
 */

import type {
  TettraArticle,
  TettraCategory,
  ImportError,
  ParsedImportData,
} from './types';

/**
 * Validate parsed import data
 * Returns array of validation errors
 */
export function validateImportData(data: ParsedImportData): ImportError[] {
  const errors: ImportError[] = [];

  // Validate articles
  data.articles.forEach((article, index) => {
    const articleErrors = validateArticle(article, index + 1);
    errors.push(...articleErrors);
  });

  // Validate categories
  data.categories.forEach((category, index) => {
    const categoryErrors = validateCategory(category, index + 1);
    errors.push(...categoryErrors);
  });

  return errors;
}

/**
 * Validate a single article
 */
export function validateArticle(
  article: TettraArticle,
  row?: number
): ImportError[] {
  const errors: ImportError[] = [];
  const prefix = row ? `Row ${row}` : article.title || 'Article';

  // Title validation
  if (!article.title || article.title.trim().length === 0) {
    errors.push({
      row,
      item: article.id || 'Unknown',
      error: 'Title is required',
      tettra_id: article.id,
    });
  } else if (article.title.length > 200) {
    errors.push({
      row,
      item: article.title,
      error: 'Title must be 200 characters or less',
      tettra_id: article.id,
    });
  }

  // Content validation
  if (!article.content || article.content.trim().length === 0) {
    errors.push({
      row,
      item: article.title || article.id || 'Unknown',
      error: 'Content is required',
      tettra_id: article.id,
    });
  }

  // Categories validation (if provided)
  if (article.categories) {
    if (!Array.isArray(article.categories)) {
      errors.push({
        row,
        item: article.title,
        error: 'Categories must be an array',
        tettra_id: article.id,
      });
    } else {
      article.categories.forEach(cat => {
        if (typeof cat !== 'string' || cat.trim().length === 0) {
          errors.push({
            row,
            item: article.title,
            error: 'Category names must be non-empty strings',
            tettra_id: article.id,
          });
        }
      });
    }
  }

  // Date validation (if provided)
  if (article.created_at && !isValidDate(article.created_at)) {
    errors.push({
      row,
      item: article.title,
      error: `Invalid created_at date format: ${article.created_at}`,
      tettra_id: article.id,
    });
  }

  if (article.updated_at && !isValidDate(article.updated_at)) {
    errors.push({
      row,
      item: article.title,
      error: `Invalid updated_at date format: ${article.updated_at}`,
      tettra_id: article.id,
    });
  }

  return errors;
}

/**
 * Validate a single category
 */
export function validateCategory(
  category: TettraCategory,
  row?: number
): ImportError[] {
  const errors: ImportError[] = [];

  // Name validation
  if (!category.name || category.name.trim().length === 0) {
    errors.push({
      row,
      item: category.id || 'Unknown',
      error: 'Category name is required',
      tettra_id: category.id,
    });
  } else if (category.name.length > 100) {
    errors.push({
      row,
      item: category.name,
      error: 'Category name must be 100 characters or less',
      tettra_id: category.id,
    });
  }

  // Description validation (if provided)
  if (category.description && category.description.length > 500) {
    errors.push({
      row,
      item: category.name,
      error: 'Category description must be 500 characters or less',
      tettra_id: category.id,
    });
  }

  // Sort order validation
  if (category.sort_order < 0) {
    errors.push({
      row,
      item: category.name,
      error: 'Sort order must be non-negative',
      tettra_id: category.id,
    });
  }

  return errors;
}

/**
 * Check if a date string is valid
 */
function isValidDate(dateString: string): boolean {
  // Try parsing as ISO date
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate category hierarchy to prevent cycles
 * Returns errors if circular references are detected
 */
export function validateCategoryHierarchy(
  categories: TettraCategory[]
): ImportError[] {
  const errors: ImportError[] = [];
  const categoryMap = new Map<string, TettraCategory>();

  // Build category map by ID and name
  categories.forEach(cat => {
    if (cat.id) {
      categoryMap.set(cat.id, cat);
    }
    categoryMap.set(cat.name, cat);
  });

  // Check for circular references
  categories.forEach(category => {
    if (category.parent) {
      const visited = new Set<string>();
      let current = category;

      while (current.parent) {
        const parentKey = current.parent;

        if (visited.has(parentKey)) {
          errors.push({
            item: category.name,
            error: `Circular reference detected in category hierarchy: ${Array.from(visited).join(' -> ')} -> ${parentKey}`,
            tettra_id: category.id,
          });
          break;
        }

        visited.add(parentKey);

        // Find parent category
        const parent = categoryMap.get(parentKey);
        if (!parent) {
          // Parent not found - will be handled during import
          break;
        }

        current = parent;
      }
    }
  });

  return errors;
}

/**
 * Perform dry-run validation
 * Validates all data without actually importing
 * Returns comprehensive validation report
 */
export interface DryRunResult {
  valid: boolean;
  errors: ImportError[];
  warnings: string[];
  stats: {
    totalArticles: number;
    totalCategories: number;
    validArticles: number;
    validCategories: number;
  };
}

export function performDryRun(data: ParsedImportData): DryRunResult {
  const errors: ImportError[] = [];
  const warnings: string[] = [];

  // Validate all data
  const validationErrors = validateImportData(data);
  errors.push(...validationErrors);

  // Validate category hierarchy
  if (data.categories.length > 0) {
    const hierarchyErrors = validateCategoryHierarchy(data.categories);
    errors.push(...hierarchyErrors);
  }

  // Count valid items
  const articleErrors = new Set(
    errors.filter(e => e.item && data.articles.some(a => a.title === e.item)).map(e => e.item)
  );
  const categoryErrors = new Set(
    errors.filter(e => e.item && data.categories.some(c => c.name === e.item)).map(e => e.item)
  );

  const validArticles = data.articles.length - articleErrors.size;
  const validCategories = data.categories.length - categoryErrors.size;

  // Generate warnings
  if (data.articles.length === 0 && data.categories.length === 0) {
    warnings.push('No articles or categories found in import file');
  }

  if (data.articles.some(a => !a.categories || a.categories.length === 0)) {
    warnings.push('Some articles have no categories assigned');
  }

  if (data.categories.some(c => !c.description)) {
    warnings.push('Some categories have no description');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalArticles: data.articles.length,
      totalCategories: data.categories.length,
      validArticles,
      validCategories,
    },
  };
}
