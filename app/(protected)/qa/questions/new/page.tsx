import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import QuestionForm from '@/components/qa/question-form';

export const metadata = {
  title: 'Ask a Question | Internal Knowledge Base',
  description: 'Ask a question to get help from your team',
};

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * Question Creation Page
 * Allows users to ask new questions
 */
export default async function NewQuestionPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Navigation */}
      <Link href="/qa">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Questions
        </Button>
      </Link>

      {/* Header */}
      <div className="border-b border-primary-200 pb-6">
        <h1 className="text-3xl font-bold text-primary-900 mb-2">
          Ask a Question
        </h1>
        <p className="text-primary-600">
          Get help from your team members. Be specific and provide enough context for others to understand your question.
        </p>
      </div>

      {/* Question Form */}
      <QuestionForm userId={user.id} />
    </div>
  );
}
