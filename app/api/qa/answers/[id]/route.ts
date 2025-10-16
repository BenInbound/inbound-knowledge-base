import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for updating an answer
const updateAnswerSchema = z.object({
  content: z.string().min(1).optional(),
});

/**
 * PATCH /api/qa/answers/[id]
 * Update an answer (only by author)
 */
export async function PATCH(
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

    const { id } = params;

    // Check if answer exists and user is the author
    const { data: existingAnswer, error: checkError } = await supabase
      .from('answers')
      .select('author_id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Answer not found' },
          { status: 404 }
        );
      }
      console.error('Error checking answer:', checkError);
      return NextResponse.json(
        { error: 'Failed to check answer' },
        { status: 500 }
      );
    }

    if (existingAnswer.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only edit your own answers' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateAnswerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    // Update answer
    const { data: updatedAnswer, error: updateError } = await supabase
      .from('answers')
      .update(updates)
      .eq('id', id)
      .select(
        `
        *,
        profiles!answers_author_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `
      )
      .single();

    if (updateError) {
      console.error('Error updating answer:', updateError);
      return NextResponse.json(
        { error: 'Failed to update answer' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedAnswer);
  } catch (error) {
    console.error('Unexpected error in PATCH /api/qa/answers/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/qa/answers/[id]
 * Delete an answer (only by author)
 */
export async function DELETE(
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

    const { id } = params;

    // Check if answer exists and user is the author
    const { data: existingAnswer, error: checkError } = await supabase
      .from('answers')
      .select('author_id, is_accepted, question_id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Answer not found' },
          { status: 404 }
        );
      }
      console.error('Error checking answer:', checkError);
      return NextResponse.json(
        { error: 'Failed to check answer' },
        { status: 500 }
      );
    }

    if (existingAnswer.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own answers' },
        { status: 403 }
      );
    }

    // Delete answer
    const { error: deleteError } = await supabase
      .from('answers')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting answer:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete answer' },
        { status: 500 }
      );
    }

    // If this was the accepted answer, update question's is_answered status
    if (existingAnswer.is_accepted) {
      // Check if there are other answers
      const { data: otherAnswers, error: checkAnswersError } = await supabase
        .from('answers')
        .select('id')
        .eq('question_id', existingAnswer.question_id);

      if (!checkAnswersError && otherAnswers && otherAnswers.length === 0) {
        // No more answers, mark question as unanswered
        await supabase
          .from('questions')
          .update({ is_answered: false })
          .eq('id', existingAnswer.question_id);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/qa/answers/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
