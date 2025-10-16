import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { full_name, avatar_url } = body;

    // Validate full_name
    if (!full_name || typeof full_name !== 'string' || full_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      );
    }

    // Validate avatar_url if provided
    if (avatar_url !== null && avatar_url !== undefined && avatar_url !== '') {
      if (typeof avatar_url !== 'string') {
        return NextResponse.json(
          { error: 'Invalid avatar URL format' },
          { status: 400 }
        );
      }
      // Basic URL validation
      try {
        new URL(avatar_url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid avatar URL' },
          { status: 400 }
        );
      }
    }

    // Update profile
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: full_name.trim(),
        avatar_url: avatar_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
