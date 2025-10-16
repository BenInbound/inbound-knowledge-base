import Link from 'next/link';
import { MessageCircle, CheckCircle, Clock, HelpCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Question, Profile } from '@/lib/types/database';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import QuestionList from '@/components/qa/question-list';
import QuestionFilter from '@/components/qa/question-filter';

interface QuestionWithAuthor extends Question {
  author_name: string;
  answer_count: number;
}

interface QAPageProps {
  searchParams: {
    filter?: 'all' | 'answered' | 'unanswered';
  };
}

/**
 * Fetch questions with author information and answer counts
 */
async function getQuestions(filter?: string): Promise<QuestionWithAuthor[]> {
  const supabase = await createClient();

  // Build base query
  let query = supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  // Apply filter
  if (filter === 'answered') {
    query = query.eq('is_answered', true);
  } else if (filter === 'unanswered') {
    query = query.eq('is_answered', false);
  }

  const { data: questions, error } = await query;

  if (error) {
    console.error('Error fetching questions:', error);
    return [];
  }

  if (!questions || questions.length === 0) {
    return [];
  }

  // Fetch author profiles
  const authorIds = Array.from(new Set(questions.map(q => q.author_id)));
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', authorIds);

  const authorMap = new Map(
    (profiles || []).map(p => [p.id, p.full_name])
  );

  // Fetch answer counts for each question
  const questionIds = questions.map(q => q.id);
  const { data: answers } = await supabase
    .from('answers')
    .select('question_id')
    .in('question_id', questionIds);

  const answerCountMap = new Map<string, number>();
  (answers || []).forEach(a => {
    answerCountMap.set(a.question_id, (answerCountMap.get(a.question_id) || 0) + 1);
  });

  // Map to QuestionWithAuthor format
  return questions.map((question) => ({
    ...question,
    author_name: authorMap.get(question.author_id) || 'Unknown',
    answer_count: answerCountMap.get(question.id) || 0,
  }));
}

/**
 * Get question statistics
 */
async function getQuestionStats(): Promise<{
  total: number;
  answered: number;
  unanswered: number;
}> {
  const supabase = await createClient();

  const [totalResult, answeredResult, unansweredResult] = await Promise.all([
    supabase
      .from('questions')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('is_answered', true),
    supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('is_answered', false),
  ]);

  return {
    total: totalResult.count || 0,
    answered: answeredResult.count || 0,
    unanswered: unansweredResult.count || 0,
  };
}

/**
 * Q&A Section Landing Page
 * Shows list of questions with filters for answered/unanswered
 */
export default async function QAPage({ searchParams }: QAPageProps) {
  const filter = searchParams.filter || 'all';

  const [questions, stats] = await Promise.all([
    getQuestions(filter),
    getQuestionStats(),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-primary-200 pb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-primary-900 mb-2">
              Questions & Answers
            </h1>
            <p className="text-primary-600">
              Ask questions and get answers from your team members
            </p>
          </div>
          <Link href="/qa/questions/new">
            <Button>
              <HelpCircle className="w-4 h-4 mr-2" />
              Ask Question
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-primary-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-900">{stats.total}</p>
              <p className="text-sm text-primary-600">Total Questions</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-900">{stats.answered}</p>
              <p className="text-sm text-primary-600">Answered</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-900">{stats.unanswered}</p>
              <p className="text-sm text-primary-600">Unanswered</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <QuestionFilter currentFilter={filter} />

      {/* Question Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-primary-600">
          {questions.length} question{questions.length === 1 ? '' : 's'} found
        </p>
        {filter !== 'all' && (
          <Link href="/qa">
            <Button variant="ghost" size="sm">
              Clear Filter
            </Button>
          </Link>
        )}
      </div>

      {/* Questions List */}
      <QuestionList questions={questions} filter={filter} />
    </div>
  );
}
