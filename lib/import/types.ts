/**
 * Import Types
 * Defines TypeScript types for Tettra import data structures
 */

export interface TettraArticle {
  id?: string;
  title: string;
  content: string;
  categories?: string[];
  author?: string;
  created_at?: string;
  updated_at?: string;
  published?: boolean;
}

export interface TettraCategory {
  id?: string;
  name: string;
  description?: string;
  parent?: string;
  sort_order?: number;
}

export interface ImportedArticle {
  title: string;
  content: any; // TipTap JSON
  excerpt?: string;
  status: 'draft' | 'published';
  categories: string[];
  tettra_id?: string;
}

export interface ImportedCategory {
  name: string;
  slug: string;
  description?: string;
  parent_name?: string;
  sort_order: number;
  tettra_id?: string;
}

export interface ImportResult {
  success: boolean;
  type: 'article' | 'category';
  title: string;
  id?: string;
  tettra_id?: string;
}

export interface ImportError {
  row?: number;
  item?: string;
  error: string;
  tettra_id?: string;
}

export interface ImportStats {
  total: number;
  success: number;
  failed: number;
}

export interface ParsedImportData {
  articles: TettraArticle[];
  categories: TettraCategory[];
}
