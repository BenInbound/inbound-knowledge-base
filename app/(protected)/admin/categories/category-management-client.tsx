"use client";

import { useState } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import CategoryTree from '@/components/categories/category-tree';
import CategoryForm, { type CategoryFormData } from '@/components/categories/category-form';
import type { Category, CategoryWithCount } from '@/lib/types/database';

interface CategoryManagementClientProps {
  initialCategories: CategoryWithCount[];
}

export default function CategoryManagementClient({
  initialCategories,
}: CategoryManagementClientProps) {
  const [categories, setCategories] = useState<CategoryWithCount[]>(initialCategories);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Create category
  const handleCreate = async (formData: CategoryFormData) => {
    setLoading(true);
    setError(null);

    try {
      const slug = generateSlug(formData.name);

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug,
          description: formData.description || null,
          parent_id: formData.parent_id || null,
          sort_order: formData.sort_order,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create category');
      }

      const { data: newCategory } = await response.json();

      // Add to categories list with article count
      setCategories([...categories, { ...newCategory, article_count: 0 }]);
      setIsCreateModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  // Edit category
  const handleEdit = async (formData: CategoryFormData) => {
    if (!selectedCategory) return;

    setLoading(true);
    setError(null);

    try {
      const slug = generateSlug(formData.name);

      const response = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug,
          description: formData.description || null,
          parent_id: formData.parent_id || null,
          sort_order: formData.sort_order,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update category');
      }

      const { data: updatedCategory } = await response.json();

      // Update categories list
      setCategories(
        categories.map((cat) =>
          cat.id === selectedCategory.id
            ? { ...updatedCategory, article_count: cat.article_count }
            : cat
        )
      );
      setIsEditModalOpen(false);
      setSelectedCategory(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  // Delete category
  const handleDelete = async () => {
    if (!selectedCategory) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete category');
      }

      // Remove from categories list
      setCategories(categories.filter((cat) => cat.id !== selectedCategory.id));
      setIsDeleteModalOpen(false);
      setSelectedCategory(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setError(null);
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const openDeleteModal = (category: Category) => {
    setSelectedCategory(category);
    setError(null);
    setIsDeleteModalOpen(true);
  };

  const selectedCategoryWithCount = selectedCategory
    ? categories.find((c) => c.id === selectedCategory.id)
    : null;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary-900">Category Management</h1>
          <p className="text-primary-600 mt-2">
            Organize your content with hierarchical categories (max 3 levels)
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Category
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Category Tree */}
      <CategoryTree
        categories={categories}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        showActions={true}
      />

      {/* Create Category Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Add a new category to organize your content. Categories can be nested up to 3 levels deep.
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            categories={categories}
            onSubmit={handleCreate}
            onCancel={() => setIsCreateModalOpen(false)}
            mode="create"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category details. Changes will be reflected immediately.
            </DialogDescription>
          </DialogHeader>
          {selectedCategory && (
            <CategoryForm
              category={selectedCategory}
              categories={categories}
              onSubmit={handleEdit}
              onCancel={() => {
                setIsEditModalOpen(false);
                setSelectedCategory(null);
              }}
              mode="edit"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Category Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category?
            </DialogDescription>
          </DialogHeader>
          {selectedCategory && (
            <div className="py-4">
              <div className="bg-primary-50 border border-primary-200 rounded-md p-4 mb-4">
                <p className="font-semibold text-primary-900">{selectedCategory.name}</p>
                {selectedCategory.description && (
                  <p className="text-sm text-primary-600 mt-1">{selectedCategory.description}</p>
                )}
              </div>

              {selectedCategoryWithCount && selectedCategoryWithCount.article_count > 0 && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-md p-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900">Warning</p>
                    <p className="text-sm text-amber-800 mt-1">
                      This category contains {selectedCategoryWithCount.article_count}{' '}
                      {selectedCategoryWithCount.article_count === 1 ? 'article' : 'articles'}.
                      Deleting it will remove the category association from these articles.
                    </p>
                  </div>
                </div>
              )}

              <p className="text-sm text-primary-600 mt-4">
                This action cannot be undone.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedCategory(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
