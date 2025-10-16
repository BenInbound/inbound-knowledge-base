"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import type { Category } from '@/lib/types/database';

interface CategoryFormProps {
  category?: Category;
  categories: Category[];
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
}

export interface CategoryFormData {
  name: string;
  description: string;
  parent_id: string | null;
  sort_order: number;
}

/**
 * Category form component for creating/editing categories
 * Includes parent category selector with max 3 levels depth validation
 */
export default function CategoryForm({
  category,
  categories,
  onSubmit,
  onCancel,
  mode = 'create',
}: CategoryFormProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category?.name || '',
    description: category?.description || '',
    parent_id: category?.parent_id || null,
    sort_order: category?.sort_order || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Calculate depth of a category by traversing up the parent chain
  const getCategoryDepth = (categoryId: string | null): number => {
    if (!categoryId) return 0;

    const cat = categories.find(c => c.id === categoryId);
    if (!cat || !cat.parent_id) return 1;

    return 1 + getCategoryDepth(cat.parent_id);
  };

  // Get available parent categories (excluding self and descendants, max depth 2)
  const getAvailableParents = (): Category[] => {
    return categories.filter(cat => {
      // Can't be its own parent
      if (category && cat.id === category.id) return false;

      // Check if this category would exceed max depth
      const depth = getCategoryDepth(cat.id);

      // If depth is already 2 (root -> parent -> child), can't add more children
      if (depth >= 2) return false;

      return true;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Category name must be 100 characters or less';
    }

    // Validate slug wouldn't conflict (basic check)
    const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existingCategory = categories.find(
      c => c.slug === slug && c.id !== category?.id
    );
    if (existingCategory) {
      newErrors.name = 'A category with this name already exists';
    }

    // Validate depth
    if (formData.parent_id) {
      const parentDepth = getCategoryDepth(formData.parent_id);
      if (parentDepth >= 2) {
        newErrors.parent_id = 'Maximum nesting depth (3 levels) would be exceeded';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setErrors({ submit: 'Failed to save category. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const availableParents = getAvailableParents();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" required>
          Category Name
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={!!errors.name}
          placeholder="e.g., Engineering, Marketing"
          disabled={loading}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          error={!!errors.description}
          placeholder="Optional description for this category"
          rows={3}
          disabled={loading}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      {/* Parent Category */}
      <div className="space-y-2">
        <Label htmlFor="parent_id">
          Parent Category
        </Label>
        <Select
          id="parent_id"
          value={formData.parent_id || ''}
          onChange={(e) => setFormData({
            ...formData,
            parent_id: e.target.value || null
          })}
          error={!!errors.parent_id}
          disabled={loading}
        >
          <option value="">None (Root Category)</option>
          {availableParents.map((cat) => {
            const depth = getCategoryDepth(cat.id);
            const indent = '  '.repeat(depth);
            return (
              <option key={cat.id} value={cat.id}>
                {indent}{cat.name}
              </option>
            );
          })}
        </Select>
        {errors.parent_id && (
          <p className="text-sm text-red-600">{errors.parent_id}</p>
        )}
        <p className="text-xs text-primary-600">
          Maximum nesting depth: 3 levels
        </p>
      </div>

      {/* Sort Order */}
      <div className="space-y-2">
        <Label htmlFor="sort_order">
          Sort Order
        </Label>
        <Input
          id="sort_order"
          type="number"
          value={formData.sort_order}
          onChange={(e) => setFormData({
            ...formData,
            sort_order: parseInt(e.target.value) || 0
          })}
          error={!!errors.sort_order}
          disabled={loading}
        />
        <p className="text-xs text-primary-600">
          Lower numbers appear first
        </p>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-800">{errors.submit}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : mode === 'create' ? 'Create Category' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
