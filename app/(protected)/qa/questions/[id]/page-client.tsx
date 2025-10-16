'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, CheckCircle, Calendar, User } from 'lucide-react';
import type { Question, Answer, Profile } from '@/lib/types/database';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRelativeTime, formatDate } from '@/lib/utils/helpers';
import AnswerForm from '@/components/qa/answer-form';
import { useRouter } from 'next/navigation';

interface QuestionWithAuthor extends Question {
  author: Profile;
}

interface AnswerWithAuthor extends Answer {
  author: Profile;
}

interface QuestionDetailClientProps {
  question: QuestionWithAuthor;
  answers: AnswerWithAuthor[];
  currentUserId: string | null;
}

export default function QuestionDetailClient({
  question,
  answers,
  currentUserId,
}: QuestionDetailClientProps) {
  const router = useRouter();
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const isAuthor = currentUserId === question.author_id;
  const acceptedAnswer = answers.find(a => a.is_accepted);

  const handleAnswerSuccess = () => {
    setShowAnswerForm(false);
    router.refresh();
  };

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      const response = await fetch(`/api/qa/answers/${answerId}/accept`, {
        method: 'POST',
      });

      if (response.ok) {
        router.refresh();
      } else {
        console.error('Failed to accept answer');
      }
    } catch (error) {
      console.error('Error accepting answer:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back Navigation */}
      <Link href="/qa">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Questions
        </Button>
      </Link>

      {/* Question Card */}
      <Card className="p-8">
        {/* Question Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-3">
              <h1 className="text-3xl font-bold text-primary-900 flex-1">
                {question.title}
              </h1>
              {question.is_answered && (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">Answered</span>
                </div>
              )}
            </div>

            {/* Question Meta */}
            <div className="flex items-center gap-4 text-sm text-primary-600">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Asked by {question.author.full_name}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(question.created_at)}</span>
              </div>
              {question.updated_at !== question.created_at && (
                <>
                  <span>•</span>
                  <span className="text-primary-500">
                    Updated {formatRelativeTime(question.updated_at)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Question Body */}
        <div className="prose prose-primary max-w-none mb-6">
          <p className="text-primary-800 whitespace-pre-wrap leading-relaxed">
            {question.body}
          </p>
        </div>

        {/* Question Actions */}
        {isAuthor && (
          <div className="flex gap-2 pt-6 border-t border-primary-200">
            <Button variant="outline" size="sm">
              Edit Question
            </Button>
            <Button variant="outline" size="sm">
              Delete Question
            </Button>
          </div>
        )}
      </Card>

      {/* Answers Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary-900 flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
          </h2>
          {currentUserId && (
            <Button onClick={() => setShowAnswerForm(!showAnswerForm)}>
              {showAnswerForm ? 'Cancel' : 'Post Answer'}
            </Button>
          )}
        </div>

        {/* Answer Form */}
        {showAnswerForm && currentUserId && (
          <AnswerForm
            questionId={question.id}
            userId={currentUserId}
            onSuccess={handleAnswerSuccess}
            onCancel={() => setShowAnswerForm(false)}
          />
        )}

        {/* Accepted Answer (if exists) */}
        {acceptedAnswer && (
          <Card className="p-6 border-2 border-green-500 bg-green-50">
            <div className="flex items-start gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-green-700">
                    Accepted Answer
                  </span>
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
        {answers.filter(a => !a.is_accepted).length > 0 && (
          <div className="space-y-4">
            {answers
              .filter(a => !a.is_accepted)
              .map((answer) => (
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

                    {/* Accept Answer Button (only for question author) */}
                    {isAuthor && !question.is_answered && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcceptAnswer(answer.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept Answer
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
          </div>
        )}

        {/* No Answers State */}
        {answers.length === 0 && !showAnswerForm && (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-primary-900 mb-2">
              No answers yet
            </h3>
            <p className="text-sm text-primary-600 mb-4">
              Be the first to answer this question!
            </p>
            {currentUserId && (
              <Button onClick={() => setShowAnswerForm(true)}>
                Post Answer
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
