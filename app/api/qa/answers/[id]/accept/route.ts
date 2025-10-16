import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/qa/answers/[id]/accept
 * Accept an answer as the solution (only by question author)
 * This will:
 * 1. Mark the answer as accepted
 * 2. Unmark any previously accepted answer for the same question
 * 3. Mark the question as answered
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

    const answerId = params.id;

    // Get the answer and verify it exists
    const { data: answer, error: answerError } = await supabase
      .from('answers')
      .select('id, question_id, is_accepted')
      .eq('id', answerId)
      .single();

    if (answerError) {
      if (answerError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Answer not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching answer:', answerError);
      return NextResponse.json(
        { error: 'Failed to fetch answer' },
        { status: 500 }
      );
    }

    // Get the question and verify user is the author
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id, author_id')
      .eq('id', answer.question_id)
      .single();

    if (questionError) {
      console.error('Error fetching question:', questionError);
      return NextResponse.json(
        { error: 'Failed to fetch question' },
        { status: 500 }
      );
    }

    if (question.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Only the question author can accept answers' },
        { status: 403 }
      );
    }

    // If this answer is already accepted, nothing to do
    if (answer.is_accepted) {
      return NextResponse.json(
        { message: 'Answer is already accepted' },
        { status: 200 }
      );
    }

    // Unmark any previously accepted answers for this question
    const { error: unmarkError } = await supabase
      .from('answers')
      .update({ is_accepted: false })
      .eq('question_id', answer.question_id)
      .eq('is_accepted', true);

    if (unmarkError) {
      console.error('Error unmarking previous accepted answer:', unmarkError);
      return NextResponse.json(
        { error: 'Failed to update previous accepted answer' },
        { status: 500 }
      );
    }

    // Mark this answer as accepted
    const { data: acceptedAnswer, error: acceptError } = await supabase
      .from('answers')
      .update({ is_accepted: true })
      .eq('id', answerId)
      .select('*')
      .single();

    if (acceptError) {
      console.error('Error accepting answer:', acceptError);
      return NextResponse.json(
        { error: 'Failed to accept answer' },
        { status: 500 }
      );
    }

    // The database trigger will automatically mark the question as answered,
    // but we'll also explicitly update it to ensure consistency
    await supabase
      .from('questions')
      .update({ is_answered: true })
      .eq('id', answer.question_id);

    return NextResponse.json({
      message: 'Answer accepted successfully',
      answer: acceptedAnswer,
    });
  } catch (error) {
    console.error(
      'Unexpected error in POST /api/qa/answers/[id]/accept:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
