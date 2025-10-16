import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Sign In - Inbound Knowledge Base',
  description: 'Sign in to access the Inbound internal knowledge base',
};

/**
 * Login page
 * Displays the login form for user authentication
 */
export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary-900">Welcome back</h2>
        <p className="mt-2 text-sm text-primary-600">
          Sign in to access the knowledge base
        </p>
      </div>

      <LoginForm />
    </div>
  );
}
