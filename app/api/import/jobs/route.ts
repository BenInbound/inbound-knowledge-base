/**
 * Import Jobs List API Endpoint
 * T160: List all import jobs for import history display
 * Retrieves all import jobs with pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Fetch import jobs
    const { data: jobs, error: jobsError, count } = await supabase
      .from('import_jobs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (jobsError) {
      console.error('Error fetching import jobs:', jobsError);
      return NextResponse.json(
        { error: 'Failed to fetch import jobs' },
        { status: 500 }
      );
    }

    // Fetch profiles for all job creators
    const creatorIds = [...new Set(jobs?.map(job => job.created_by) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', creatorIds);

    // Create profile lookup map
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Format response
    const formattedJobs = jobs?.map((job: any) => {
      const creator = profileMap.get(job.created_by);
      return {
        id: job.id,
        status: job.status,
        fileName: job.file_name,
        stats: job.stats,
        createdBy: creator
          ? {
              fullName: creator.full_name,
              email: creator.email,
            }
          : null,
        createdAt: job.created_at,
        completedAt: job.completed_at,
        hasErrors: job.errors && job.errors.length > 0,
      };
    }) || [];

    return NextResponse.json({
      jobs: formattedJobs,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error in GET /api/import/jobs:', error);

    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
