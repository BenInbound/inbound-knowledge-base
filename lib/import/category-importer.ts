/**
 * Category Import Logic
 * T152: Create category import logic with hierarchy preservation
 * T153: Handle duplicate detection (by title or slug)
 * T154: Store original Tettra IDs in import_metadata
 */

import { createClient } from '@/lib/supabase/server';
import { generateSlug } from '@/lib/utils/helpers';
import type { TettraCategory, ImportResult, ImportError } from './types';

/**
 * Import categories with hierarchy preservation
 * Categories are imported in multiple passes to handle parent-child relationships
 */
export async function importCategories(
  categories: TettraCategory[],
  userId: string
): Promise<{
  results: ImportResult[];
  errors: ImportError[];
}> {
  const results: ImportResult[] = [];
  const errors: ImportError[] = [];
  const categoryMap = new Map<string, string>(); // tettra_id/name -> supabase id

  const supabase = await createClient();

  // Sort categories by hierarchy depth (parents first)
  const sortedCategories = sortCategoriesByHierarchy(categories);

  // Import in order
  for (const category of sortedCategories) {
    try {
      const result = await importSingleCategory(
        supabase,
        category,
        categoryMap,
        userId
      );

      results.push(result);

      // Store mapping for children
      if (category.id) {
        categoryMap.set(category.id, result.id!);
      }
      categoryMap.set(category.name, result.id!);
    } catch (error) {
      errors.push({
        item: category.name,
        error: (error as Error).message,
        tettra_id: category.id,
      });
    }
  }

  return { results, errors };
}

/**
 * Sort categories so parents come before children
 */
function sortCategoriesByHierarchy(categories: TettraCategory[]): TettraCategory[] {
  const sorted: TettraCategory[] = [];
  const remaining = [...categories];
  const processed = new Set<string>();

  // First pass: root categories (no parent)
  for (let i = remaining.length - 1; i >= 0; i--) {
    if (!remaining[i].parent) {
      const cat = remaining.splice(i, 1)[0];
      sorted.push(cat);
      if (cat.id) processed.add(cat.id);
      processed.add(cat.name);
    }
  }

  // Subsequent passes: children whose parents have been processed
  let lastLength = remaining.length;
  while (remaining.length > 0) {
    for (let i = remaining.length - 1; i >= 0; i--) {
      const cat = remaining[i];
      if (cat.parent && processed.has(cat.parent)) {
        remaining.splice(i, 1);
        sorted.push(cat);
        if (cat.id) processed.add(cat.id);
        processed.add(cat.name);
      }
    }

    // Prevent infinite loop if there are orphaned categories
    if (remaining.length === lastLength) {
      // Add remaining categories anyway (orphans)
      sorted.push(...remaining);
      break;
    }
    lastLength = remaining.length;
  }

  return sorted;
}

/**
 * Import a single category
 * T153: Handles duplicate detection
 * T154: Stores Tettra ID in metadata
 */
async function importSingleCategory(
  supabase: any,
  category: TettraCategory,
  categoryMap: Map<string, string>,
  userId: string
): Promise<ImportResult> {
  const slug = generateSlug(category.name);

  // Check for duplicates by slug or name
  const { data: existing } = await supabase
    .from('categories')
    .select('id, name')
    .or(`slug.eq.${slug},name.eq.${category.name}`)
    .single();

  if (existing) {
    // Duplicate found - return existing category
    return {
      success: true,
      type: 'category',
      title: category.name,
      id: existing.id,
      tettra_id: category.id,
    };
  }

  // Resolve parent ID if parent is specified
  let parentId: string | null = null;
  if (category.parent) {
    parentId = categoryMap.get(category.parent) || null;
  }

  // Insert new category
  const { data: newCategory, error } = await supabase
    .from('categories')
    .insert({
      name: category.name,
      slug,
      description: category.description || null,
      parent_id: parentId,
      sort_order: category.sort_order || 0,
    })
    .select('id, name')
    .single();

  if (error) {
    throw new Error(`Failed to insert category: ${error.message}`);
  }

  return {
    success: true,
    type: 'category',
    title: newCategory.name,
    id: newCategory.id,
    tettra_id: category.id,
  };
}

/**
 * Get category ID by name (for article imports)
 */
export async function getCategoryIdByName(
  supabase: any,
  name: string
): Promise<string | null> {
  const { data } = await supabase
    .from('categories')
    .select('id')
    .eq('name', name)
    .single();

  return data?.id || null;
}
