import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Auth callback handler
 * Handles the OAuth callback from Supabase after email confirmation
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // Redirect to login with error message
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`
      );
    }

    // Get the user to check the email domain
    const { data: { user } } = await supabase.auth.getUser();

    if (user?.email && !user.email.endsWith('@inbound.no')) {
      // Invalid domain - sign out and redirect with error
      await supabase.auth.signOut();
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent('Only @inbound.no email addresses are allowed.')}`
      );
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(`${requestUrl.origin}${next}`);
  }

  // No code present, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login`);
}
