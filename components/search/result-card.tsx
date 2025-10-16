import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { SearchResult } from '@/lib/types/database';

interface ResultCardProps {
  result: SearchResult;
  query: string;
}

export function ResultCard({ result, query }: ResultCardProps) {
  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;

    // Create a regex to match the search terms (case-insensitive)
    const terms = searchQuery
      .trim()
      .split(/\s+/)
      .filter((term) => term.length > 0);

    if (terms.length === 0) return text;

    const regex = new RegExp(`(${terms.join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <mark key={index} className="bg-yellow-200 font-medium">
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  const typeIcon =
    result.type === 'article' ? (
      <svg
        className="h-5 w-5 text-blue-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ) : (
      <svg
        className="h-5 w-5 text-green-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );

  const typeLabel =
    result.type === 'article' ? 'Article' : 'Q&A Question';

  const createdAgo = formatDistanceToNow(new Date(result.created_at), {
    addSuffix: true,
  });

  return (
    <Link href={result.url} className="block group">
      <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          {typeIcon}
          <span className="text-sm text-gray-500">{typeLabel}</span>
          <span className="text-gray-300">•</span>
          <span className="text-sm text-gray-500">{createdAgo}</span>
          {result.rank && (
            <>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-gray-400">
                Relevance: {(result.rank * 100).toFixed(0)}%
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 mb-2">
          {highlightText(result.title, query)}
        </h3>

        {/* Excerpt */}
        {result.excerpt && (
          <p className="text-gray-600 line-clamp-2">
            {highlightText(result.excerpt, query)}
          </p>
        )}
      </div>
    </Link>
  );
}
