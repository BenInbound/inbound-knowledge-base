import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for creating an answer
const createAnswerSchema = z.object({
  content: z.string().min(1),
});

/**
 * POST /api/qa/questions/[id]/answers
 * Create a new answer for a question
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const questionId = params.id;

    // Verify question exists
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id')
      .eq('id', questionId)
      .single();

    if (questionError) {
      if (questionError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        );
      }
      console.error('Error checking question:', questionError);
      return NextResponse.json(
        { error: 'Failed to check question' },
        { status: 500 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createAnswerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { content } = validationResult.data;

    // Insert answer
    const { data: answer, error: insertError } = await supabase
      .from('answers')
      .insert({
        question_id: questionId,
        author_id: user.id,
        content,
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error creating answer:', insertError);
      return NextResponse.json(
        { error: 'Failed to create answer' },
        { status: 500 }
      );
    }

    return NextResponse.json(answer, { status: 201 });
  } catch (error) {
    console.error(
      'Unexpected error in POST /api/qa/questions/[id]/answers:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
