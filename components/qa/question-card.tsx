import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/utils/helpers';

interface QuestionCardProps {
  id: string;
  title: string;
  body: string;
  authorName: string;
  isAnswered: boolean;
  answerCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Question Card Component
 * Displays a single question with answer count and metadata
 */
export default function QuestionCard({
  id,
  title,
  body,
  authorName,
  isAnswered,
  answerCount,
  createdAt,
  updatedAt,
}: QuestionCardProps) {
  return (
    <Link href={`/qa/questions/${id}`}>
      <Card className="p-6 hover:shadow-lg hover:border-primary-300 transition-all cursor-pointer group">
        <div className="flex items-start gap-4">
          {/* Answer Count Badge */}
          <div className="flex flex-col items-center min-w-[60px]">
            <div
              className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center ${
                isAnswered
                  ? 'bg-green-100 text-green-700'
                  : answerCount > 0
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-primary-100 text-primary-700'
              }`}
            >
              <span className="text-lg font-bold">{answerCount}</span>
            </div>
            <span className="text-xs text-primary-500 mt-1">
              {answerCount === 1 ? 'answer' : 'answers'}
            </span>
          </div>

          {/* Question Content */}
          <div className="flex-1">
            <div className="flex items-start gap-2 mb-2">
              <h3 className="text-lg font-semibold text-primary-900 group-hover:text-primary-700 transition-colors flex-1">
                {title}
              </h3>
              {isAnswered && (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              )}
            </div>

            <p className="text-sm text-primary-600 line-clamp-2 mb-3">{body}</p>

            <div className="flex items-center gap-4 text-xs text-primary-500">
              <span>Asked by {authorName}</span>
              <span>•</span>
              <span>{formatRelativeTime(createdAt)}</span>
              {updatedAt !== createdAt && (
                <>
                  <span>•</span>
                  <span>Updated {formatRelativeTime(updatedAt)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
