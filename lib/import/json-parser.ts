/**
 * JSON Parser for Tettra Export Format
 * T148: Implement JSON parser for Tettra export format
 */

import type { ParsedImportData, TettraArticle, TettraCategory } from './types';

/**
 * Parse JSON content into structured import data
 * Supports various Tettra export JSON formats
 */
export async function parseJSON(fileContent: string): Promise<ParsedImportData> {
  let data: any;

  try {
    data = JSON.parse(fileContent);
  } catch (error) {
    throw new Error('Invalid JSON format: ' + (error as Error).message);
  }

  // Handle different JSON structures
  if (Array.isArray(data)) {
    return parseArrayFormat(data);
  } else if (data.articles || data.categories) {
    return parseObjectFormat(data);
  } else if (data.data) {
    // Nested data format
    return parseJSON(JSON.stringify(data.data));
  } else {
    throw new Error('Unrecognized JSON structure. Expected array or object with articles/categories fields.');
  }
}

/**
 * Parse array format: [{ title, content, ... }, ...]
 */
function parseArrayFormat(data: any[]): ParsedImportData {
  if (data.length === 0) {
    throw new Error('JSON array is empty');
  }

  // Detect data type from first item
  const firstItem = data[0];

  // Check for standard format or Tettra export format
  const isArticleData =
    ('title' in firstItem && ('content' in firstItem || 'body' in firstItem)) ||
    ('page_title' in firstItem && 'html' in firstItem);

  if (isArticleData) {
    const articles = data.map(item => parseArticleObject(item));
    return { articles, categories: [] };
  } else if ('name' in firstItem) {
    const categories = data.map(item => parseCategoryObject(item));
    return { articles: [], categories };
  } else {
    throw new Error('Unable to determine data type from JSON array');
  }
}

/**
 * Parse object format: { articles: [...], categories: [...] }
 */
function parseObjectFormat(data: any): ParsedImportData {
  const articles = Array.isArray(data.articles)
    ? data.articles.map((item: any) => parseArticleObject(item))
    : [];

  const categories = Array.isArray(data.categories)
    ? data.categories.map((item: any) => parseCategoryObject(item))
    : [];

  return { articles, categories };
}

/**
 * Parse a single article object from JSON
 */
function parseArticleObject(obj: any): TettraArticle {
  // Build categories array from Tettra's category_name and subcategory_name
  let categories;
  if (obj.category_name || obj.subcategory_name) {
    categories = [obj.category_name, obj.subcategory_name].filter(Boolean);
  } else {
    categories = parseCategories(obj.categories || obj.category || obj.tags);
  }

  // Skip deleted pages (deleted_at is not null)
  const isDeleted = obj.deleted_at && obj.deleted_at !== null;

  return {
    id: obj.id || obj.article_id || obj.tettra_id,
    title: obj.page_title || obj.title || obj.name || '',
    content: obj.html || obj.content || obj.body || obj.text || '',
    categories,
    author: obj.owner_name || obj.author || obj.created_by || obj.author_name,
    created_at: obj.created_at || obj.created || obj.date,
    updated_at: obj.updated_at || obj.updated || obj.modified_at,
    published: isDeleted ? false : parseBoolean(obj.published || obj.status || obj.state),
  };
}

/**
 * Parse a single category object from JSON
 */
function parseCategoryObject(obj: any): TettraCategory {
  return {
    id: obj.id || obj.category_id || obj.tettra_id,
    name: obj.name || obj.title || '',
    description: obj.description || obj.desc,
    parent: obj.parent || obj.parent_id || obj.parent_category,
    sort_order: parseInt(obj.sort_order || obj.order || obj.position) || 0,
  };
}

/**
 * Parse categories field (can be string, array, or object)
 */
function parseCategories(value: any): string[] | undefined {
  if (!value) return undefined;

  if (Array.isArray(value)) {
    return value.map(v => {
      if (typeof v === 'string') return v;
      if (typeof v === 'object') return v.name || v.title || String(v);
      return String(v);
    });
  }

  if (typeof value === 'string') {
    // Split by comma, semicolon, or pipe
    return value.split(/[,;|]/).map(c => c.trim()).filter(c => c);
  }

  if (typeof value === 'object' && value.name) {
    return [value.name];
  }

  return undefined;
}

/**
 * Parse boolean-like values
 */
function parseBoolean(value: any): boolean | undefined {
  if (value === undefined || value === null) return undefined;

  if (typeof value === 'boolean') return value;

  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (['true', 'yes', '1', 'published', 'active'].includes(lower)) {
      return true;
    }
    if (['false', 'no', '0', 'draft', 'inactive'].includes(lower)) {
      return false;
    }
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return undefined;
}
