/**
 * Database entity types matching Supabase schema
 * These types represent the raw database structure
 */

// ============================================================================
// Core Entity Types
// ============================================================================

export type UserRole = 'admin' | 'member';

export type ArticleStatus = 'draft' | 'published' | 'archived';

export type ImportJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ============================================================================
// Table Types
// ============================================================================

export interface Profile {
  id: string; // UUID from auth.users
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface Category {
  id: string; // UUID
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null; // UUID reference to parent category
  sort_order: number;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface Article {
  id: string; // UUID
  title: string;
  slug: string;
  content: ArticleContent; // JSONB - TipTap editor output
  excerpt: string | null;
  status: ArticleStatus;
  author_id: string; // UUID reference to auth.users
  published_at: string | null; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  view_count: number;
  import_metadata: ImportMetadata | null; // JSONB - Tettra import data
}

export interface ArticleCategory {
  article_id: string; // UUID
  category_id: string; // UUID
  created_at: string; // ISO timestamp
}

export interface Question {
  id: string; // UUID
  title: string;
  body: string;
  author_id: string; // UUID reference to auth.users
  is_answered: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface Answer {
  id: string; // UUID
  question_id: string; // UUID reference to questions
  author_id: string; // UUID reference to auth.users
  content: string;
  is_accepted: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface ImportJob {
  id: string; // UUID
  created_by: string; // UUID reference to auth.users
  status: ImportJobStatus;
  file_name: string;
  stats: ImportJobStats; // JSONB
  errors: ImportError[] | null; // JSONB array
  started_at: string | null; // ISO timestamp
  completed_at: string | null; // ISO timestamp
  created_at: string; // ISO timestamp
}

// ============================================================================
// Nested/JSON Types
// ============================================================================

/**
 * TipTap editor content structure (JSONB)
 * Represents the rich text document in ProseMirror JSON format
 */
export interface ArticleContent {
  type: 'doc';
  content?: ArticleContentNode[];
}

export interface ArticleContentNode {
  type: string; // 'paragraph', 'heading', 'bulletList', 'image', etc.
  attrs?: Record<string, any>;
  content?: ArticleContentNode[];
  marks?: Array<{
    type: string;
    attrs?: Record<string, any>;
  }>;
  text?: string;
}

/**
 * Import metadata stored in articles (JSONB)
 * Tracks original Tettra IDs and import details
 */
export interface ImportMetadata {
  tettra_id?: string;
  tettra_url?: string;
  imported_at: string; // ISO timestamp
  import_job_id: string; // UUID reference to import_jobs
  original_author_email?: string;
}

/**
 * Import job statistics (JSONB)
 */
export interface ImportJobStats {
  total: number;
  success: number;
  failed: number;
}

/**
 * Import error details (JSONB array element)
 */
export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: Record<string, any>;
}

// ============================================================================
// Extended Types with Relations
// ============================================================================

/**
 * Article with related entities loaded
 */
export interface ArticleWithRelations extends Article {
  author: Profile;
  categories: Category[];
}

/**
 * Article list item (optimized for list views)
 */
export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: ArticleStatus;
  author_id: string;
  author_name: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  view_count: number;
  category_count: number;
}

/**
 * Category with article count
 */
export interface CategoryWithCount extends Category {
  article_count: number;
  subcategory_count?: number;
}

/**
 * Category tree node for hierarchical display
 */
export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
  article_count: number;
  depth: number; // 0 = root, 1 = first level, etc.
}

/**
 * Question with related entities
 */
export interface QuestionWithRelations extends Question {
  author: Profile;
  answers: AnswerWithAuthor[];
  accepted_answer: AnswerWithAuthor | null;
}

/**
 * Answer with author profile
 */
export interface AnswerWithAuthor extends Answer {
  author: Profile;
}

/**
 * Search result item (union of articles and questions)
 */
export interface SearchResult {
  type: 'article' | 'question';
  id: string;
  title: string;
  excerpt: string;
  rank: number; // PostgreSQL ts_rank score
  created_at: string;
  url: string; // Computed URL for linking
  author_name?: string;
}

// ============================================================================
// Database Query Result Types
// ============================================================================

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Database error response
 */
export interface DatabaseError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

// ============================================================================
// Supabase Utility Types
// ============================================================================

/**
 * Generic Supabase query response
 */
export type SupabaseResponse<T> =
  | { data: T; error: null }
  | { data: null; error: DatabaseError };

/**
 * Supabase list response with pagination
 */
export interface SupabaseListResponse<T> {
  data: T[] | null;
  error: DatabaseError | null;
  count: number | null;
}

// ============================================================================
// Insert/Update Types (omit generated/auto fields)
// ============================================================================

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>;
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at'>>;

export type CategoryInsert = Omit<Category, 'id' | 'created_at' | 'updated_at'>;
export type CategoryUpdate = Partial<Omit<Category, 'id' | 'created_at'>>;

export type ArticleInsert = Omit<Article, 'id' | 'created_at' | 'updated_at' | 'view_count'>;
export type ArticleUpdate = Partial<Omit<Article, 'id' | 'created_at' | 'author_id'>>;

export type QuestionInsert = Omit<Question, 'id' | 'created_at' | 'updated_at' | 'is_answered'>;
export type QuestionUpdate = Partial<Omit<Question, 'id' | 'created_at' | 'author_id'>>;

export type AnswerInsert = Omit<Answer, 'id' | 'created_at' | 'updated_at' | 'is_accepted'>;
export type AnswerUpdate = Partial<Omit<Answer, 'id' | 'created_at' | 'author_id' | 'question_id'>>;

export type ImportJobInsert = Omit<ImportJob, 'id' | 'created_at'>;
export type ImportJobUpdate = Partial<Omit<ImportJob, 'id' | 'created_at' | 'created_by'>>;
