import Link from 'next/link';
import { ArticleMetadata } from './article-metadata';
import { ArticleRenderer } from '@/components/editor/article-renderer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ArticleWithRelations } from '@/lib/types/database';

interface ArticleViewProps {
  article: ArticleWithRelations;
  currentUserId?: string;
  currentUserRole?: 'admin' | 'member' | null;
}

export function ArticleView({ article, currentUserId, currentUserRole }: ArticleViewProps) {
  const isAuthor = currentUserId && article.author_id === currentUserId;
  const isAdmin = currentUserRole === 'admin';
  const canEdit = isAuthor || isAdmin;

  return (
    <article className="space-y-6">
      {/* Draft/Archived status banner */}
      {article.status !== 'published' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">
                  {article.status === 'draft' ? 'Draft' : 'Archived'}
                </span>
                {' - '}This article is not published and is only visible to you
                {isAdmin && !isAuthor && ' (as an admin)'}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Article Header */}
      <header className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold text-gray-900">{article.title}</h1>
              {article.status !== 'published' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  {article.status === 'draft' ? 'Draft' : 'Archived'}
                </span>
              )}
            </div>

            {article.excerpt && (
              <p className="text-xl text-gray-600 mt-4">{article.excerpt}</p>
            )}
          </div>

          {/* Edit button - visible to author or admin */}
          {canEdit && (
            <Link href={`/articles/${article.id}/edit`}>
              <Button variant="outline" className="flex-shrink-0">
                Edit Article
              </Button>
            </Link>
          )}
        </div>

        <ArticleMetadata article={article} />
      </header>

      {/* Article Content */}
      <Card className="p-8">
        <ArticleRenderer content={article.content} />
      </Card>

      {/* Categories */}
      {article.categories.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-500">Categories:</span>
          {article.categories.map((category) => (
            <a
              key={category.id}
              href={`/categories/${category.id}`}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
            >
              {category.name}
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
