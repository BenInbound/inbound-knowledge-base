import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for updating a question
const updateQuestionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).optional(),
});

/**
 * GET /api/qa/questions/[id]
 * Get a single question with all its answers
 */
export async function GET(
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

    // Fetch question with author and answers
    const { data: question, error: fetchError } = await supabase
      .from('questions')
      .select(
        `
        *,
        profiles!questions_author_id_fkey (
          id,
          full_name,
          avatar_url
        ),
        answers (
          *,
          profiles!answers_author_id_fkey (
            id,
            full_name,
            avatar_url
          )
        )
      `
      )
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching question:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch question' },
        { status: 500 }
      );
    }

    // Sort answers: accepted first, then by creation date
    if (question.answers) {
      question.answers.sort((a: any, b: any) => {
        if (a.is_accepted && !b.is_accepted) return -1;
        if (!a.is_accepted && b.is_accepted) return 1;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error('Unexpected error in GET /api/qa/questions/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/qa/questions/[id]
 * Update a question (only by author)
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

    // Check if question exists and user is the author
    const { data: existingQuestion, error: checkError } = await supabase
      .from('questions')
      .select('author_id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        );
      }
      console.error('Error checking question:', checkError);
      return NextResponse.json(
        { error: 'Failed to check question' },
        { status: 500 }
      );
    }

    if (existingQuestion.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only edit your own questions' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateQuestionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    // Update question
    const { data: updatedQuestion, error: updateError } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select(
        `
        *,
        profiles!questions_author_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `
      )
      .single();

    if (updateError) {
      console.error('Error updating question:', updateError);
      return NextResponse.json(
        { error: 'Failed to update question' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error('Unexpected error in PATCH /api/qa/questions/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/qa/questions/[id]
 * Delete a question (only by author)
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

    // Check if question exists and user is the author
    const { data: existingQuestion, error: checkError } = await supabase
      .from('questions')
      .select('author_id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        );
      }
      console.error('Error checking question:', checkError);
      return NextResponse.json(
        { error: 'Failed to check question' },
        { status: 500 }
      );
    }

    if (existingQuestion.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own questions' },
        { status: 403 }
      );
    }

    // Delete question (answers will be cascade deleted)
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting question:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete question' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/qa/questions/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
