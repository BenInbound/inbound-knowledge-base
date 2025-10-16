/**
 * Import Job Detail API Endpoint
 * T159: Create GET /api/import/jobs/[id] endpoint
 * Retrieves detailed information about a specific import job
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const jobId = params.id;

    // Fetch import job details
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError) {
      if (jobError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Import job not found' },
          { status: 404 }
        );
      }

      console.error('Error fetching import job:', jobError);
      return NextResponse.json(
        { error: 'Failed to fetch import job' },
        { status: 500 }
      );
    }

    // Fetch creator profile information
    const { data: creator } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', job.created_by)
      .single();

    // Return job details with creator info
    return NextResponse.json({
      id: job.id,
      status: job.status,
      fileName: job.file_name,
      stats: job.stats,
      errors: job.errors || [],
      createdBy: creator
        ? {
            id: job.created_by,
            fullName: creator.full_name,
            email: creator.email,
          }
        : null,
      createdAt: job.created_at,
      completedAt: job.completed_at,
    });
  } catch (error) {
    console.error('Error in GET /api/import/jobs/[id]:', error);

    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
