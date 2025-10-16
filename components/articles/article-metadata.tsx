import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import type { ArticleWithRelations } from '@/lib/types/database';

interface ArticleMetadataProps {
  article: ArticleWithRelations;
}

export function ArticleMetadata({ article }: ArticleMetadataProps) {
  const publishedDate = article.published_at
    ? new Date(article.published_at)
    : null;
  const updatedDate = new Date(article.updated_at);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 border-b border-gray-200 pb-4">
      {/* Author */}
      <div className="flex items-center gap-2">
        {article.author.avatar_url && (
          <Image
            src={article.author.avatar_url}
            alt={article.author.full_name}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full"
          />
        )}
        <span className="font-medium text-gray-900">
          {article.author.full_name}
        </span>
      </div>

      <span className="text-gray-400">•</span>

      {/* Published Date */}
      {publishedDate && (
        <>
          <div className="flex items-center gap-1">
            <span>Published</span>
            <time
              dateTime={article.published_at!}
              title={formatDate(publishedDate)}
            >
              {getTimeAgo(publishedDate)}
            </time>
          </div>
          <span className="text-gray-400">•</span>
        </>
      )}

      {/* Updated Date */}
      {article.updated_at !== article.created_at && (
        <>
          <div className="flex items-center gap-1">
            <span>Updated</span>
            <time
              dateTime={article.updated_at}
              title={formatDate(updatedDate)}
            >
              {getTimeAgo(updatedDate)}
            </time>
          </div>
          <span className="text-gray-400">•</span>
        </>
      )}

      {/* View Count */}
      <div className="flex items-center gap-1">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        <span>
          {article.view_count} {article.view_count === 1 ? 'view' : 'views'}
        </span>
      </div>
    </div>
  );
}
