'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

interface QuestionFormProps {
  userId: string;
}

export default function QuestionForm({ userId }: QuestionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title.trim()) {
      setError('Please enter a question title');
      return;
    }

    if (formData.title.length < 10) {
      setError('Question title must be at least 10 characters');
      return;
    }

    if (!formData.body.trim()) {
      setError('Please provide more details about your question');
      return;
    }

    if (formData.body.length < 20) {
      setError('Question details must be at least 20 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const { data, error: insertError } = await supabase
        .from('questions')
        .insert([
          {
            title: formData.title.trim(),
            body: formData.body.trim(),
            author_id: userId,
            is_answered: false,
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating question:', insertError);
        setError('Failed to create question. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Redirect to the new question page
      router.push(`/qa/questions/${data.id}`);
      router.refresh();
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/qa');
  };

  return (
    <Card className="p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Title Field */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-primary-900">
            Question Title <span className="text-red-500">*</span>
          </label>
          <Input
            id="title"
            type="text"
            placeholder="What do you want to know?"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            disabled={isSubmitting}
            className="text-base"
            maxLength={200}
            required
          />
          <p className="text-xs text-primary-500">
            Be specific and clear. {formData.title.length}/200 characters
          </p>
        </div>

        {/* Body Field */}
        <div className="space-y-2">
          <label htmlFor="body" className="block text-sm font-medium text-primary-900">
            Question Details <span className="text-red-500">*</span>
          </label>
          <textarea
            id="body"
            rows={8}
            placeholder="Provide more context about your question. What have you tried? What information do you need?"
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical"
            maxLength={2000}
            required
          />
          <p className="text-xs text-primary-500">
            Include any relevant details, examples, or context. {formData.body.length}/2000 characters
          </p>
        </div>

        {/* Guidelines */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-primary-900 mb-2">
            Tips for asking a good question:
          </h4>
          <ul className="text-sm text-primary-700 space-y-1 list-disc list-inside">
            <li>Be specific and concise in your title</li>
            <li>Provide enough context for others to understand</li>
            <li>Mention what you&apos;ve already tried</li>
            <li>Explain why you need this information</li>
            <li>Use proper grammar and formatting</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-4 border-t border-primary-200">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? 'Posting...' : 'Post Question'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
