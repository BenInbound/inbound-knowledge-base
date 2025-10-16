'use client';

/**
 * Signup form component
 * Handles user registration with email domain validation (@inbound.no)
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorMessage } from '@/components/ui/error';
import { signup } from '@/lib/auth/actions';
import { signupSchema, type SignupInput } from '@/lib/validation/schemas';
import type { AuthErrorResponse } from '@/lib/types/auth';

export function SignupForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<SignupInput>({
    email: '',
    password: '',
    full_name: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SignupInput, string>>>({});
  const [authError, setAuthError] = useState<AuthErrorResponse | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setAuthError(null);
    setSuccess(false);

    // Client-side validation
    const validationResult = signupSchema.safeParse(formData);
    if (!validationResult.success) {
      const fieldErrors: Partial<Record<keyof SignupInput, string>> = {};
      validationResult.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof SignupInput] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Client-side domain validation (additional layer)
    if (!formData.email.endsWith('@inbound.no')) {
      setAuthError({
        error: 'invalid_domain',
        message: 'Only @inbound.no email addresses are allowed. Please use your company email.',
      });
      return;
    }

    // Submit to server action
    startTransition(async () => {
      try {
        const result = await signup(formData);

        if (result.error) {
          setAuthError(result.error);
          return;
        }

        if (result.needsEmailConfirmation) {
          setSuccess(true);
        }
        // If successful and auto-confirmed, the server action will redirect
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
    if (errors[name as keyof SignupInput]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    // Clear auth error when user starts typing
    if (authError) {
      setAuthError(null);
    }
  };

  // Show success message if email confirmation is needed
  if (success) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-green-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-green-900 mb-1">Check your email</h3>
              <p className="text-sm text-green-800 leading-relaxed">
                We&apos;ve sent a confirmation link to <strong>{formData.email}</strong>.
                Please check your inbox and click the link to activate your account.
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => router.push('/login')}
        >
          Go to login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {authError && (
        <ErrorMessage
          title={authError.error === 'invalid_domain' ? 'Invalid Email Domain' : 'Signup Failed'}
          message={authError.message}
          variant="destructive"
        />
      )}

      <div>
        <label
          htmlFor="full_name"
          className="block text-sm font-medium text-primary-900 mb-1.5"
        >
          Full name
        </label>
        <Input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          required
          value={formData.full_name}
          onChange={handleChange}
          error={!!errors.full_name}
          placeholder="Your name"
          disabled={isPending}
        />
        {errors.full_name && (
          <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
        )}
      </div>

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
        <p className="mt-1 text-xs text-primary-600">
          Only @inbound.no email addresses are allowed
        </p>
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
          autoComplete="new-password"
          required
          value={formData.password}
          onChange={handleChange}
          error={!!errors.password}
          placeholder="At least 8 characters"
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
        {isPending ? 'Creating account...' : 'Create account'}
      </Button>

      <div className="text-center text-sm">
        <span className="text-primary-600">Already have an account? </span>
        <Link
          href="/login"
          className="font-medium text-accent-600 hover:text-accent-700 underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </form>
  );
}
