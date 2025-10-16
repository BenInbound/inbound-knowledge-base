/**
 * Article Import Logic
 * T151: Create article import logic with category mapping
 * T153: Handle duplicate detection (by title or slug)
 * T154: Store original Tettra IDs in article import_metadata field
 */

import { createClient } from '@/lib/supabase/server';
import { generateSlug } from '@/lib/utils/helpers';
import { getCategoryIdByName } from './category-importer';
import type { TettraArticle, ImportResult, ImportError } from './types';

/**
 * Convert plain text/HTML content to TipTap JSON format
 */
function convertToTipTapJSON(content: string): any {
  // Simple conversion: wrap content in paragraph nodes
  // In production, you might want to use a proper HTML to TipTap converter

  // Split by paragraphs (double newlines or <p> tags)
  let paragraphs: string[];

  if (content.includes('<p>')) {
    // HTML content
    paragraphs = content
      .split(/<\/?p>/gi)
      .map(p => p.trim())
      .filter(p => p && !p.startsWith('<'));
  } else {
    // Plain text
    paragraphs = content
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p);
  }

  // Convert to TipTap format
  const nodes = paragraphs.map(paragraph => ({
    type: 'paragraph',
    content: [
      {
        type: 'text',
        text: paragraph.replace(/<[^>]+>/g, ''), // Strip any remaining HTML tags
      },
    ],
  }));

  return {
    type: 'doc',
    content: nodes.length > 0 ? nodes : [
      {
        type: 'paragraph',
        content: [],
      },
    ],
  };
}

/**
 * Generate excerpt from content (first 200 characters)
 */
function generateExcerpt(content: string): string {
  const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return plainText.length > 200 ? plainText.substring(0, 197) + '...' : plainText;
}

/**
 * Import articles with category mapping
 */
export async function importArticles(
  articles: TettraArticle[],
  userId: string
): Promise<{
  results: ImportResult[];
  errors: ImportError[];
}> {
  const results: ImportResult[] = [];
  const errors: ImportError[] = [];

  const supabase = await createClient();

  for (const article of articles) {
    try {
      const result = await importSingleArticle(supabase, article, userId);
      results.push(result);
    } catch (error) {
      errors.push({
        item: article.title,
        error: (error as Error).message,
        tettra_id: article.id,
      });
    }
  }

  return { results, errors };
}

/**
 * Import a single article
 * T153: Handles duplicate detection
 * T154: Stores Tettra ID in import_metadata
 */
async function importSingleArticle(
  supabase: any,
  article: TettraArticle,
  userId: string
): Promise<ImportResult> {
  const slug = generateSlug(article.title);

  // Check for duplicates by slug or title
  const { data: existing } = await supabase
    .from('articles')
    .select('id, title')
    .or(`slug.eq.${slug},title.eq.${article.title}`)
    .single();

  if (existing) {
    // Duplicate found - return existing article
    return {
      success: true,
      type: 'article',
      title: article.title,
      id: existing.id,
      tettra_id: article.id,
    };
  }

  // Convert content to TipTap JSON
  const contentJSON = convertToTipTapJSON(article.content);
  const excerpt = generateExcerpt(article.content);

  // Determine status
  const status = article.published !== false ? 'published' : 'draft';

  // Prepare import metadata
  const importMetadata: any = {};
  if (article.id) {
    importMetadata.tettra_id = article.id;
  }
  if (article.author) {
    importMetadata.original_author = article.author;
  }
  if (article.created_at) {
    importMetadata.original_created_at = article.created_at;
  }

  // Insert article
  const { data: newArticle, error } = await supabase
    .from('articles')
    .insert({
      title: article.title,
      slug,
      content: contentJSON,
      excerpt,
      status,
      author_id: userId,
      import_metadata: Object.keys(importMetadata).length > 0 ? importMetadata : null,
      published_at: status === 'published' ? new Date().toISOString() : null,
    })
    .select('id, title')
    .single();

  if (error) {
    throw new Error(`Failed to insert article: ${error.message}`);
  }

  // Map categories
  if (article.categories && article.categories.length > 0) {
    await mapArticleCategories(supabase, newArticle.id, article.categories);
  }

  return {
    success: true,
    type: 'article',
    title: newArticle.title,
    id: newArticle.id,
    tettra_id: article.id,
  };
}

/**
 * Map categories to article
 */
async function mapArticleCategories(
  supabase: any,
  articleId: string,
  categoryNames: string[]
): Promise<void> {
  const categoryIds: string[] = [];

  // Resolve category names to IDs
  for (const name of categoryNames) {
    const categoryId = await getCategoryIdByName(supabase, name.trim());
    if (categoryId) {
      categoryIds.push(categoryId);
    }
  }

  // Insert article-category relationships
  if (categoryIds.length > 0) {
    const relationships = categoryIds.map(categoryId => ({
      article_id: articleId,
      category_id: categoryId,
    }));

    const { error } = await supabase
      .from('article_categories')
      .insert(relationships);

    if (error) {
      console.error('Failed to map categories:', error);
      // Don't throw - article is already created
    }
  }
}
