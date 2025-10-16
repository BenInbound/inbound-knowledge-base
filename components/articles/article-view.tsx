import Link from 'next/link';
import { ArticleMetadata } from './article-metadata';
import { ArticleRenderer } from '@/components/editor/article-renderer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ArticleWithRelations } from '@/lib/types/database';

interface ArticleViewProps {
  article: ArticleWithRelations;
  currentUserId?: string;
}

export function ArticleView({ article, currentUserId }: ArticleViewProps) {
  const isAuthor = currentUserId && article.author_id === currentUserId;

  return (
    <article className="space-y-6">
      {/* Article Header */}
      <header className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900">{article.title}</h1>

            {article.excerpt && (
              <p className="text-xl text-gray-600 mt-4">{article.excerpt}</p>
            )}
          </div>

          {/* Edit button - only visible to author */}
          {isAuthor && (
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
