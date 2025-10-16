'use server';

/**
 * Server-side authentication actions
 * These functions handle login, signup, and logout operations
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from '@/lib/validation/schemas';
import type { AuthErrorResponse } from '@/lib/types/auth';

/**
 * Login action - authenticates user with email and password
 */
export async function login(data: LoginInput): Promise<{ error?: AuthErrorResponse }> {
  // Validate input
  const validationResult = loginSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      error: {
        error: 'invalid_credentials',
        message: validationResult.error.errors[0]?.message || 'Invalid email or password',
      },
    };
  }

  const { email, password } = validationResult.data;

  // Create Supabase client
  const supabase = await createClient();

  // Attempt to sign in
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Map Supabase errors to our auth error types
    if (error.message.includes('Invalid login credentials')) {
      return {
        error: {
          error: 'invalid_credentials',
          message: 'Invalid email or password',
        },
      };
    }

    if (error.message.includes('Email not confirmed')) {
      return {
        error: {
          error: 'email_not_confirmed',
          message: 'Please check your email to confirm your account',
        },
      };
    }

    return {
      error: {
        error: 'invalid_credentials',
        message: error.message,
      },
    };
  }

  // Revalidate the layout to update the auth state
  revalidatePath('/', 'layout');

  // Redirect to home page
  redirect('/');
}

/**
 * Signup action - creates new user account
 */
export async function signup(data: SignupInput): Promise<{ error?: AuthErrorResponse; needsEmailConfirmation?: boolean }> {
  // Validate input
  const validationResult = signupSchema.safeParse(data);
  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];

    // Check if it's the email domain error
    if (firstError?.message.includes('@inbound.no')) {
      return {
        error: {
          error: 'invalid_domain',
          message: 'Only @inbound.no email addresses are allowed',
        },
      };
    }

    return {
      error: {
        error: 'invalid_credentials',
        message: firstError?.message || 'Invalid signup data',
      },
    };
  }

  const { email, password, full_name } = validationResult.data;

  // Create Supabase client
  const supabase = await createClient();

  // Attempt to sign up
  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    // Check for domain restriction error from database trigger
    if (error.message.includes('@inbound.no') || error.message.includes('domain')) {
      return {
        error: {
          error: 'invalid_domain',
          message: 'Only @inbound.no email addresses are allowed',
        },
      };
    }

    if (error.message.includes('already registered')) {
      return {
        error: {
          error: 'invalid_credentials',
          message: 'An account with this email already exists',
        },
      };
    }

    return {
      error: {
        error: 'invalid_credentials',
        message: error.message,
      },
    };
  }

  // Check if email confirmation is required
  if (authData.user && !authData.session) {
    return {
      needsEmailConfirmation: true,
    };
  }

  // If auto-confirmed, revalidate and redirect
  revalidatePath('/', 'layout');
  redirect('/');
}

/**
 * Logout action - signs out the current user
 */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

/**
 * Get current user session
 * Note: This is a convenience function for server components
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return {
    ...user,
    profile: profile || undefined,
  };
}
