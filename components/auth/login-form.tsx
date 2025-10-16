'use client';

/**
 * Login form component
 * Handles user authentication with email and password
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorMessage } from '@/components/ui/error';
import { login } from '@/lib/auth/actions';
import { loginSchema, type LoginInput } from '@/lib/validation/schemas';
import type { AuthErrorResponse } from '@/lib/types/auth';

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<LoginInput>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
  const [authError, setAuthError] = useState<AuthErrorResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setAuthError(null);

    // Client-side validation
    const validationResult = loginSchema.safeParse(formData);
    if (!validationResult.success) {
      const fieldErrors: Partial<Record<keyof LoginInput, string>> = {};
      validationResult.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof LoginInput] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Submit to server action
    startTransition(async () => {
      try {
        const result = await login(formData);
        if (result.error) {
          setAuthError(result.error);
        }
        // If successful, the server action will redirect
      } catch (error) {
        setAuthError({
          error: 'invalid_credentials',
          message: 'An unexpected error occurred. Please try again.',
        });
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof LoginInput]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    // Clear auth error when user starts typing
    if (authError) {
      setAuthError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {authError && (
        <ErrorMessage
          title="Login Failed"
          message={authError.message}
          variant="destructive"
        />
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-primary-900 mb-1.5"
        >
          Email address
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={handleChange}
          error={!!errors.email}
          placeholder="you@inbound.no"
          disabled={isPending}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-primary-900 mb-1.5"
        >
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={formData.password}
          onChange={handleChange}
          error={!!errors.password}
          placeholder="Enter your password"
          disabled={isPending}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isPending}
      >
        {isPending ? 'Signing in...' : 'Sign in'}
      </Button>

      <div className="text-center text-sm">
        <span className="text-primary-600">Don&apos;t have an account? </span>
        <Link
          href="/signup"
          className="font-medium text-accent-600 hover:text-accent-700 underline-offset-4 hover:underline"
        >
          Sign up
        </Link>
      </div>
    </form>
  );
}
