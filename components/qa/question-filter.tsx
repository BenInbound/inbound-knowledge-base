import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface QuestionFilterProps {
  currentFilter: 'all' | 'answered' | 'unanswered';
}

/**
 * Question Filter Component
 * Toggle between all, answered, and unanswered questions
 */
export default function QuestionFilter({ currentFilter }: QuestionFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-primary-700">Filter:</span>
      <Link href="/qa">
        <Button variant={currentFilter === 'all' ? 'default' : 'outline'} size="sm">
          All
        </Button>
      </Link>
      <Link href="/qa?filter=unanswered">
        <Button variant={currentFilter === 'unanswered' ? 'default' : 'outline'} size="sm">
          Unanswered
        </Button>
      </Link>
      <Link href="/qa?filter=answered">
        <Button variant={currentFilter === 'answered' ? 'default' : 'outline'} size="sm">
          Answered
        </Button>
      </Link>
    </div>
  );
}
