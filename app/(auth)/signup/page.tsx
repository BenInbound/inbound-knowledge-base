import type { Metadata } from 'next';
import { SignupForm } from '@/components/auth/signup-form';

export const metadata: Metadata = {
  title: 'Sign Up - Inbound Knowledge Base',
  description: 'Create an account to access the Inbound internal knowledge base',
};

/**
 * Signup page
 * Displays the signup form for user registration
 */
export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary-900">Create an account</h2>
        <p className="mt-2 text-sm text-primary-600">
          Join the Inbound knowledge base
        </p>
      </div>

      <SignupForm />
    </div>
  );
}
