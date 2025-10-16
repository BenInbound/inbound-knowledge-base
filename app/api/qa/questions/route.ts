import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for creating a question
const createQuestionSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
});

/**
 * POST /api/qa/questions
 * Create a new question
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createQuestionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { title, body: questionBody } = validationResult.data;

    // Insert question
    const { data: question, error: insertError } = await supabase
      .from('questions')
      .insert({
        title,
        body: questionBody,
        author_id: user.id,
      })
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

    if (insertError) {
      console.error('Error creating question:', insertError);
      return NextResponse.json(
        { error: 'Failed to create question' },
        { status: 500 }
      );
    }

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/qa/questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/qa/questions
 * List questions with optional filters
 * Query parameters:
 * - answered: 'true' | 'false' (filter by answered status)
 * - author_id: UUID (filter by author)
 * - limit: number (default: 20)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const answeredParam = searchParams.get('answered');
    const authorId = searchParams.get('author_id');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query
    let query = supabase
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
          id
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (answeredParam !== null) {
      const isAnswered = answeredParam === 'true';
      query = query.eq('is_answered', isAnswered);
    }

    if (authorId) {
      query = query.eq('author_id', authorId);
    }

    const { data: questions, error: fetchError, count } = await query;

    if (fetchError) {
      console.error('Error fetching questions:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }

    // Add answer count to each question
    const questionsWithCounts = questions?.map((question) => ({
      ...question,
      answer_count: question.answers?.length || 0,
      answers: undefined, // Remove the answers array
    }));

    return NextResponse.json({
      questions: questionsWithCounts,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/qa/questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
