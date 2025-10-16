import { User as SupabaseUser } from "@supabase/supabase-js";

/**
 * User role types
 */
export type UserRole = "admin" | "member";

/**
 * User profile extending Supabase auth
 * Corresponds to the profiles table in the database
 */
export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Extended user type combining Supabase auth user with profile
 */
export interface User extends SupabaseUser {
  profile?: Profile;
}

/**
 * User with required profile (for authenticated contexts)
 */
export interface AuthenticatedUser extends SupabaseUser {
  profile: Profile;
}

/**
 * Profile update payload (for updating user profiles)
 */
export interface ProfileUpdatePayload {
  full_name?: string;
  avatar_url?: string | null;
}

/**
 * User session data
 */
export interface UserSession {
  user: AuthenticatedUser;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

/**
 * Auth error types
 */
export type AuthError =
  | "invalid_credentials"
  | "invalid_domain"
  | "email_not_confirmed"
  | "user_not_found"
  | "session_expired"
  | "unauthorized";

/**
 * Auth error response
 */
export interface AuthErrorResponse {
  error: AuthError;
  message: string;
}
