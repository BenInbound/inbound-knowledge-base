import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Question, Answer, Profile } from '@/lib/types/database';
import QuestionDetailClient from './page-client';

interface QuestionWithAuthor extends Question {
  author: Profile;
}

interface AnswerWithAuthor extends Answer {
  author: Profile;
}

interface QuestionDetailPageProps {
  params: {
    id: string;
  };
}

/**
 * Fetch question with author information
 */
async function getQuestion(id: string): Promise<QuestionWithAuthor | null> {
  const supabase = await createClient();

  const { data: question, error } = await supabase
    .from('questions')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !question) {
    console.error('Error fetching question:', error);
    return null;
  }

  // Fetch author profile
  const { data: author } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', question.author_id)
    .single();

  if (!author) {
    return null;
  }

  return {
    ...question,
    author,
  };
}

/**
 * Fetch answers for a question with author information
 */
async function getAnswers(questionId: string): Promise<AnswerWithAuthor[]> {
  const supabase = await createClient();

  const { data: answers, error } = await supabase
    .from('answers')
    .select('*')
    .eq('question_id', questionId)
    .order('is_accepted', { ascending: false }) // Accepted answer first
    .order('created_at', { ascending: true }); // Then oldest first

  if (error || !answers || answers.length === 0) {
    return [];
  }

  // Fetch author profiles
  const authorIds = Array.from(new Set(answers.map(a => a.author_id)));
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', authorIds);

  const authorMap = new Map(
    (profiles || []).map(p => [p.id, p])
  );

  // Map answers with author information
  return answers
    .map((answer) => {
      const author = authorMap.get(answer.author_id);
      if (!author) return null;
      return {
        ...answer,
        author,
      };
    })
    .filter((a): a is AnswerWithAuthor => a !== null);
}

/**
 * Get current user information
 */
async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Question Detail Page
 * Shows question with all answers
 */
export default async function QuestionDetailPage({ params }: QuestionDetailPageProps) {
  const [question, answers, currentUser] = await Promise.all([
    getQuestion(params.id),
    getAnswers(params.id),
    getCurrentUser(),
  ]);

  if (!question) {
    notFound();
  }

  return (
    <QuestionDetailClient
      question={question}
      answers={answers}
      currentUserId={currentUser?.id || null}
    />
  );
}
