import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QuestionCard from './question-card';

interface Question {
  id: string;
  title: string;
  body: string;
  author_name: string;
  is_answered: boolean;
  answer_count: number;
  created_at: string;
  updated_at: string;
}

interface QuestionListProps {
  questions: Question[];
  filter?: 'all' | 'answered' | 'unanswered';
}

/**
 * Question List Component
 * Displays a list of questions with empty state handling
 */
export default function QuestionList({ questions, filter = 'all' }: QuestionListProps) {
  // Show questions if any exist
  if (questions.length > 0) {
    return (
      <div className="space-y-4">
        {questions.map((question) => (
          <QuestionCard
            key={question.id}
            id={question.id}
            title={question.title}
            body={question.body}
            authorName={question.author_name}
            isAnswered={question.is_answered}
            answerCount={question.answer_count}
            createdAt={question.created_at}
            updatedAt={question.updated_at}
          />
        ))}
      </div>
    );
  }

  // Empty state when no questions found
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
        <HelpCircle className="w-8 h-8 text-primary-400" />
      </div>
      <h3 className="text-lg font-semibold text-primary-900 mb-2">No questions found</h3>
      <p className="text-sm text-primary-600 max-w-md mb-4">
        {filter === 'answered'
          ? 'No answered questions yet.'
          : filter === 'unanswered'
          ? 'Great! All questions have been answered.'
          : 'Be the first to ask a question!'}
      </p>
      <div className="flex gap-2">
        {filter !== 'all' && (
          <Link href="/qa">
            <Button variant="outline">View All Questions</Button>
          </Link>
        )}
        <Link href="/qa/questions/new">
          <Button>Ask Question</Button>
        </Link>
      </div>
    </div>
  );
}
