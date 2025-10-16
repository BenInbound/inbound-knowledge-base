import { CheckCircle, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils/helpers';

interface Answer {
  id: string;
  content: string;
  author: {
    id: string;
    full_name: string;
  };
  is_accepted: boolean;
  created_at: string;
  updated_at: string;
}

interface AnswerListProps {
  answers: Answer[];
  isQuestionAuthor: boolean;
  isQuestionAnswered: boolean;
  onAcceptAnswer?: (answerId: string) => void;
}

/**
 * Answer List Component
 * Displays all answers with accepted answer at the top
 */
export default function AnswerList({
  answers,
  isQuestionAuthor,
  isQuestionAnswered,
  onAcceptAnswer,
}: AnswerListProps) {
  const acceptedAnswer = answers.find((a) => a.is_accepted);
  const otherAnswers = answers.filter((a) => !a.is_accepted);

  // Empty state
  if (answers.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-primary-400" />
        </div>
        <h3 className="text-lg font-semibold text-primary-900 mb-2">No answers yet</h3>
        <p className="text-sm text-primary-600 mb-4">Be the first to answer this question!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Accepted Answer (shown first) */}
      {acceptedAnswer && (
        <Card className="p-6 border-2 border-green-500 bg-green-50">
          <div className="flex items-start gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-green-700">Accepted Answer</span>
              </div>
              <div className="prose prose-primary max-w-none mb-4">
                <p className="text-primary-800 whitespace-pre-wrap leading-relaxed">
                  {acceptedAnswer.content}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-primary-600">
                <span>By {acceptedAnswer.author.full_name}</span>
                <span>•</span>
                <span>{formatRelativeTime(acceptedAnswer.created_at)}</span>
                {acceptedAnswer.updated_at !== acceptedAnswer.created_at && (
                  <>
                    <span>•</span>
                    <span>Edited {formatRelativeTime(acceptedAnswer.updated_at)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Other Answers */}
      {otherAnswers.map((answer) => (
        <Card key={answer.id} className="p-6">
          <div className="prose prose-primary max-w-none mb-4">
            <p className="text-primary-800 whitespace-pre-wrap leading-relaxed">
              {answer.content}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-primary-200">
            <div className="flex items-center gap-4 text-xs text-primary-600">
              <span>By {answer.author.full_name}</span>
              <span>•</span>
              <span>{formatRelativeTime(answer.created_at)}</span>
              {answer.updated_at !== answer.created_at && (
                <>
                  <span>•</span>
                  <span>Edited {formatRelativeTime(answer.updated_at)}</span>
                </>
              )}
            </div>

            {/* Accept Answer Button (only for question author on unanswered questions) */}
            {isQuestionAuthor && !isQuestionAnswered && onAcceptAnswer && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAcceptAnswer(answer.id)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept Answer
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
