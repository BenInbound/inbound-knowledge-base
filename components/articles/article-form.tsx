'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { slugify, debounce } from '@/lib/utils/helpers';
import { createArticleSchema } from '@/lib/validation/schemas';
import type { ArticleContent, Category, ArticleStatus } from '@/lib/types/database';
import { z } from 'zod';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// Dynamically import TipTap editor for code splitting (large bundle)
const TipTapEditor = dynamic(
  () => import('@/components/editor/tiptap-editor').then((mod) => ({ default: mod.TipTapEditor })),
  {
    loading: () => (
      <div className="border border-gray-300 rounded-lg p-4 min-h-[400px]">
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    ),
    ssr: false, // Editor should only load on client side
  }
);

interface ArticleFormProps {
  userId: string;
  initialData?: {
    id?: string;
    title: string;
    slug?: string;
    content: ArticleContent;
    excerpt?: string | null;
    status: ArticleStatus;
    category_ids?: string[];
  };
  categories: Category[];
  onSave?: (data: any) => Promise<void>;
  autoSave?: boolean;
}

interface FormErrors {
  title?: string;
  content?: string;
  categories?: string;
}

export function ArticleForm({
  userId,
  initialData,
  categories,
  onSave,
  autoSave = true,
}: ArticleFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState<ArticleContent>(
    initialData?.content || {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    }
  );
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [status, setStatus] = useState<ArticleStatus>(initialData?.status || 'draft');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialData?.category_ids || []
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track changes
  useEffect(() => {
    if (initialData) {
      // Only mark as changed if values differ from initial
      const hasChanges =
        title !== initialData.title ||
        JSON.stringify(content) !== JSON.stringify(initialData.content) ||
        excerpt !== (initialData.excerpt || '') ||
        status !== initialData.status ||
        JSON.stringify(selectedCategories) !== JSON.stringify(initialData.category_ids || []);
      setHasUnsavedChanges(hasChanges);
    } else {
      // New article - has changes if any content exists
      setHasUnsavedChanges(title.length > 0 || (content.content?.length ?? 0) > 1);
    }
  }, [title, content, excerpt, status, selectedCategories, initialData]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Title validation
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    // Content validation - check if there's actual content
    const hasContent =
      content.content &&
      content.content.some(
        (node: any) =>
          (node.content && node.content.length > 0) || (node.text && node.text.trim())
      );

    if (!hasContent) {
      newErrors.content = 'Article content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, content]);

  // Auto-save handler (debounced)
  const performAutoSave = useCallback(async () => {
    if (!autoSave || !hasUnsavedChanges || !title.trim()) {
      return;
    }

    try {
      const slug = initialData?.slug || slugify(title);
      const articleData = {
        title,
        slug,
        content,
        excerpt: excerpt || null,
        status: 'draft' as ArticleStatus, // Auto-save always saves as draft
        category_ids: selectedCategories,
      };

      // Validate against schema
      createArticleSchema.parse(articleData);

      // Call API
      const response = await fetch(
        initialData?.id ? `/api/articles/${initialData.id}` : '/api/articles',
        {
          method: initialData?.id ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(articleData),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save article');
      }

      toast.success('Draft auto-saved');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Auto-save error:', error);
      // Silent failure for auto-save
    }
  }, [
    autoSave,
    hasUnsavedChanges,
    title,
    content,
    excerpt,
    selectedCategories,
    initialData,
  ]);

  // Debounced auto-save (30 seconds)
  const debouncedAutoSave = useCallback(debounce(performAutoSave, 30000), [performAutoSave]);

  // Trigger auto-save when content changes
  useEffect(() => {
    if (hasUnsavedChanges && autoSave) {
      debouncedAutoSave();
    }
  }, [hasUnsavedChanges, autoSave, debouncedAutoSave]);

  // Handle manual save
  const handleSave = async (saveStatus: ArticleStatus = 'draft') => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      const slug = initialData?.slug || slugify(title);
      const articleData = {
        title,
        slug,
        content,
        excerpt: excerpt || null,
        status: saveStatus,
        category_ids: selectedCategories,
      };

      // Validate against schema
      createArticleSchema.parse(articleData);

      if (onSave) {
        await onSave(articleData);
      } else {
        // Default save behavior
        const response = await fetch(
          initialData?.id ? `/api/articles/${initialData.id}` : '/api/articles',
          {
            method: initialData?.id ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(articleData),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to save article');
        }

        const result = await response.json();
        toast.success(
          saveStatus === 'published' ? 'Article published!' : 'Draft saved successfully!'
        );
        setHasUnsavedChanges(false);

        // Redirect to article page after successful save
        setTimeout(() => {
          router.push(`/articles/${result.data.id}`);
        }, 1000);
      }
    } catch (error) {
      console.error('Save error:', error);
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof FormErrors;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
        toast.error('Please fix the validation errors');
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save article. Please try again.';
        toast.error(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Unsaved changes indicator */}
      {hasUnsavedChanges && (
        <div className="bg-yellow-50 text-yellow-700 border border-yellow-200 p-3 rounded-lg text-sm">
          You have unsaved changes. {autoSave && 'Auto-save will trigger in 30 seconds.'}
        </div>
      )}

      {/* Title input */}
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title *
        </label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter article title..."
          error={!!errors.title}
          className="text-2xl font-bold h-14"
          maxLength={200}
        />
        {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
        <p className="text-xs text-gray-500">{title.length}/200 characters</p>
      </div>

      {/* Excerpt input */}
      <div className="space-y-2">
        <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700">
          Excerpt (optional)
        </label>
        <Input
          id="excerpt"
          type="text"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Brief summary of the article..."
          maxLength={500}
        />
        <p className="text-xs text-gray-500">{excerpt.length}/500 characters</p>
      </div>

      {/* Category selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Categories (optional)</label>
        <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
          {categories.length === 0 ? (
            <p className="text-sm text-gray-500">No categories available</p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{category.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        {errors.categories && <p className="text-sm text-red-600">{errors.categories}</p>}
      </div>

      {/* Content editor */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Content *</label>
        <TipTapEditor
          content={content}
          onChange={setContent}
          userId={userId}
          placeholder="Start writing your article..."
        />
        {errors.content && <p className="text-sm text-red-600">{errors.content}</p>}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>

        <div className="flex items-center space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSave('draft')}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save as Draft'}
          </Button>

          <Button
            type="button"
            onClick={() => handleSave('published')}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>
    </div>
  );
}
