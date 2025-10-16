/**
 * CSV Parser for Tettra Export Format
 * T147: Implement CSV parser for Tettra export format
 */

import type { ParsedImportData, TettraArticle, TettraCategory } from './types';

/**
 * Parse CSV content into structured import data
 * Supports basic CSV format with headers
 */
export async function parseCSV(fileContent: string): Promise<ParsedImportData> {
  const lines = fileContent.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]);

  // Detect data type based on headers
  const isArticleData = headers.some(h =>
    ['title', 'content', 'body'].includes(h.toLowerCase())
  );

  const isCategoryData = headers.some(h =>
    ['category', 'name'].includes(h.toLowerCase()) &&
    !headers.some(h => ['title', 'content'].includes(h.toLowerCase()))
  );

  if (isArticleData) {
    const articles = parseArticlesCSV(lines);
    return { articles, categories: [] };
  } else if (isCategoryData) {
    const categories = parseCategoriesCSV(lines);
    return { articles: [], categories };
  } else {
    throw new Error('Unable to determine CSV data type. Expected article or category data.');
  }
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quotes
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field delimiter
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current.trim());

  return result;
}

/**
 * Parse CSV rows into article objects
 */
function parseArticlesCSV(lines: string[]): TettraArticle[] {
  const headers = parseCSVLine(lines[0]);
  const articles: TettraArticle[] = [];

  // Map common header variations to our fields
  const headerMap: Record<string, string> = {};
  headers.forEach((header, index) => {
    const normalized = header.toLowerCase().trim();
    if (['id', 'article_id', 'tettra_id'].includes(normalized)) {
      headerMap[index.toString()] = 'id';
    } else if (['title', 'name'].includes(normalized)) {
      headerMap[index.toString()] = 'title';
    } else if (['content', 'body', 'text'].includes(normalized)) {
      headerMap[index.toString()] = 'content';
    } else if (['category', 'categories', 'tags'].includes(normalized)) {
      headerMap[index.toString()] = 'categories';
    } else if (['author', 'created_by'].includes(normalized)) {
      headerMap[index.toString()] = 'author';
    } else if (['created', 'created_at', 'date'].includes(normalized)) {
      headerMap[index.toString()] = 'created_at';
    } else if (['updated', 'updated_at', 'modified'].includes(normalized)) {
      headerMap[index.toString()] = 'updated_at';
    } else if (['published', 'status', 'state'].includes(normalized)) {
      headerMap[index.toString()] = 'published';
    }
  });

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length === 0 || values.every(v => !v)) {
      continue; // Skip empty rows
    }

    const article: TettraArticle = {
      title: '',
      content: '',
    };

    values.forEach((value, index) => {
      const field = headerMap[index.toString()];
      if (!field) return;

      switch (field) {
        case 'id':
          article.id = value;
          break;
        case 'title':
          article.title = value;
          break;
        case 'content':
          article.content = value;
          break;
        case 'categories':
          // Split by comma, semicolon, or pipe
          article.categories = value
            .split(/[,;|]/)
            .map(c => c.trim())
            .filter(c => c);
          break;
        case 'author':
          article.author = value;
          break;
        case 'created_at':
          article.created_at = value;
          break;
        case 'updated_at':
          article.updated_at = value;
          break;
        case 'published':
          article.published = ['true', 'yes', '1', 'published'].includes(
            value.toLowerCase()
          );
          break;
      }
    });

    if (article.title && article.content) {
      articles.push(article);
    }
  }

  return articles;
}

/**
 * Parse CSV rows into category objects
 */
function parseCategoriesCSV(lines: string[]): TettraCategory[] {
  const headers = parseCSVLine(lines[0]);
  const categories: TettraCategory[] = [];

  // Map common header variations to our fields
  const headerMap: Record<string, string> = {};
  headers.forEach((header, index) => {
    const normalized = header.toLowerCase().trim();
    if (['id', 'category_id', 'tettra_id'].includes(normalized)) {
      headerMap[index.toString()] = 'id';
    } else if (['name', 'title', 'category'].includes(normalized)) {
      headerMap[index.toString()] = 'name';
    } else if (['description', 'desc'].includes(normalized)) {
      headerMap[index.toString()] = 'description';
    } else if (['parent', 'parent_id', 'parent_category'].includes(normalized)) {
      headerMap[index.toString()] = 'parent';
    } else if (['order', 'sort_order', 'position'].includes(normalized)) {
      headerMap[index.toString()] = 'sort_order';
    }
  });

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length === 0 || values.every(v => !v)) {
      continue; // Skip empty rows
    }

    const category: TettraCategory = {
      name: '',
      sort_order: 0,
    };

    values.forEach((value, index) => {
      const field = headerMap[index.toString()];
      if (!field) return;

      switch (field) {
        case 'id':
          category.id = value;
          break;
        case 'name':
          category.name = value;
          break;
        case 'description':
          category.description = value;
          break;
        case 'parent':
          category.parent = value;
          break;
        case 'sort_order':
          category.sort_order = parseInt(value) || 0;
          break;
      }
    });

    if (category.name) {
      categories.push(category);
    }
  }

  return categories;
}
