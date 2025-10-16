'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AnswerFormProps {
  questionId: string;
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Answer Form Component
 * Allows users to submit answers to questions
 */
export default function AnswerForm({ questionId, userId, onSuccess, onCancel }: AnswerFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!content.trim()) {
      setError('Please provide an answer');
      return;
    }

    if (content.length < 20) {
      setError('Answer must be at least 20 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      // Use the API endpoint instead of direct Supabase access
      const response = await fetch(`/api/qa/questions/${questionId}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating answer:', errorData);
        setError(errorData.error || 'Failed to post answer. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Reset form
      setContent('');
      setIsSubmitting(false);

      // Call success callback or refresh page
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">Your Answer</h3>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Content Field */}
        <div className="space-y-2">
          <label htmlFor="answer-content" className="block text-sm font-medium text-primary-900">
            Answer <span className="text-red-500">*</span>
          </label>
          <textarea
            id="answer-content"
            rows={6}
            placeholder="Share your knowledge and help answer this question..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical"
            maxLength={5000}
            required
          />
          <p className="text-xs text-primary-500">
            {content.length}/5000 characters (minimum 20)
          </p>
        </div>

        {/* Guidelines */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-primary-900 mb-2">
            Tips for writing a good answer:
          </h4>
          <ul className="text-sm text-primary-700 space-y-1 list-disc list-inside">
            <li>Be clear and concise</li>
            <li>Provide specific examples or steps</li>
            <li>Explain the reasoning behind your solution</li>
            <li>Use proper grammar and formatting</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting || content.length < 20}
            className="min-w-[120px]"
          >
            {isSubmitting ? 'Posting...' : 'Post Answer'}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
