/**
 * Zod validation schemas for forms and API inputs
 * These schemas validate user input before database operations
 */

import { z } from 'zod';

// ============================================================================
// Common Field Validators
// ============================================================================

/**
 * Email validation with @inbound.no domain restriction
 */
export const inboundEmailSchema = z
  .string()
  .email('Invalid email address')
  .endsWith('@inbound.no', 'Only @inbound.no email addresses are allowed');

/**
 * Password validation (Supabase minimum requirements)
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be less than 72 characters');

/**
 * Slug validation (URL-friendly identifiers)
 */
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(200, 'Slug must be less than 200 characters')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase alphanumeric with hyphens only'
  );

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid('Invalid UUID');

/**
 * Rich text content validation (TipTap JSON)
 */
export const richTextContentSchema = z.object({
  type: z.literal('doc'),
  content: z.array(z.any()).optional(), // Flexible for various node types
});

// ============================================================================
// Authentication Schemas
// ============================================================================

export const loginSchema = z.object({
  email: inboundEmailSchema,
  password: passwordSchema,
});

export const signupSchema = z.object({
  email: inboundEmailSchema,
  password: passwordSchema,
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters')
    .trim(),
});

export const resetPasswordSchema = z.object({
  email: inboundEmailSchema,
});

export const updatePasswordSchema = z
  .object({
    current_password: passwordSchema,
    new_password: passwordSchema,
    confirm_password: passwordSchema,
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });

// ============================================================================
// Profile Schemas
// ============================================================================

export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters')
    .trim()
    .optional(),
  avatar_url: z.string().url('Invalid avatar URL').nullable().optional(),
});

// ============================================================================
// Article Schemas
// ============================================================================

export const createArticleSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  slug: slugSchema.optional(), // Auto-generated if not provided
  content: richTextContentSchema,
  excerpt: z
    .string()
    .max(500, 'Excerpt must be less than 500 characters')
    .nullable()
    .optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  category_ids: z
    .array(uuidSchema)
    .min(0, 'At least one category is recommended')
    .optional(),
});

export const updateArticleSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  slug: slugSchema.optional(),
  content: richTextContentSchema.optional(),
  excerpt: z
    .string()
    .max(500, 'Excerpt must be less than 500 characters')
    .nullable()
    .optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  category_ids: z.array(uuidSchema).optional(),
});

export const articleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  author_id: uuidSchema.optional(),
  category_id: uuidSchema.optional(),
  sort: z.enum(['created_at', 'updated_at', 'published_at', 'title', 'view_count']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// Category Schemas
// ============================================================================

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be less than 100 characters')
    .trim(),
  slug: slugSchema.optional(), // Auto-generated if not provided
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .nullable()
    .optional(),
  parent_id: uuidSchema.nullable().optional(),
  sort_order: z.number().int().min(0).default(0).optional(),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be less than 100 characters')
    .trim()
    .optional(),
  slug: slugSchema.optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .nullable()
    .optional(),
  parent_id: uuidSchema.nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export const categoryQuerySchema = z.object({
  parent_id: uuidSchema.nullable().optional(),
  include_children: z.coerce.boolean().default(false),
  sort: z.enum(['name', 'sort_order', 'created_at']).default('sort_order'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

// ============================================================================
// Question & Answer Schemas
// ============================================================================

export const createQuestionSchema = z.object({
  title: z
    .string()
    .min(1, 'Question title is required')
    .max(200, 'Question title must be less than 200 characters')
    .trim(),
  body: z
    .string()
    .min(10, 'Question body must be at least 10 characters')
    .max(5000, 'Question body must be less than 5000 characters')
    .trim(),
});

export const updateQuestionSchema = z.object({
  title: z
    .string()
    .min(1, 'Question title is required')
    .max(200, 'Question title must be less than 200 characters')
    .trim()
    .optional(),
  body: z
    .string()
    .min(10, 'Question body must be at least 10 characters')
    .max(5000, 'Question body must be less than 5000 characters')
    .trim()
    .optional(),
});

export const createAnswerSchema = z.object({
  question_id: uuidSchema,
  content: z
    .string()
    .min(10, 'Answer must be at least 10 characters')
    .max(5000, 'Answer must be less than 5000 characters')
    .trim(),
});

export const updateAnswerSchema = z.object({
  content: z
    .string()
    .min(10, 'Answer must be at least 10 characters')
    .max(5000, 'Answer must be less than 5000 characters')
    .trim()
    .optional(),
  is_accepted: z.boolean().optional(),
});

export const questionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  is_answered: z.coerce.boolean().optional(),
  author_id: uuidSchema.optional(),
  sort: z.enum(['created_at', 'updated_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// Search Schemas
// ============================================================================

export const searchQuerySchema = z.object({
  q: z
    .string()
    .min(1, 'Search query is required')
    .max(200, 'Search query must be less than 200 characters')
    .trim(),
  type: z.enum(['all', 'article', 'question']).default('all'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// ============================================================================
// Import Schemas
// ============================================================================

export const tettraImportSchema = z.object({
  file: z.instanceof(File, { message: 'File is required' }),
  dry_run: z.boolean().default(false),
});

export const importJobQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  sort: z.enum(['created_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// Image Upload Schema
// ============================================================================

export const imageUploadSchema = z.object({
  file: z
    .instanceof(File, { message: 'File is required' })
    .refine((file) => file.size <= 5 * 1024 * 1024, 'Image must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type),
      'Only JPEG, PNG, GIF, and WebP images are allowed'
    ),
});

// ============================================================================
// Type Exports (inferred from schemas)
// ============================================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ArticleQueryInput = z.infer<typeof articleQuerySchema>;

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryQueryInput = z.infer<typeof categoryQuerySchema>;

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type CreateAnswerInput = z.infer<typeof createAnswerSchema>;
export type UpdateAnswerInput = z.infer<typeof updateAnswerSchema>;
export type QuestionQueryInput = z.infer<typeof questionQuerySchema>;

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type TettraImportInput = z.infer<typeof tettraImportSchema>;
export type ImportJobQueryInput = z.infer<typeof importJobQuerySchema>;
export type ImageUploadInput = z.infer<typeof imageUploadSchema>;
