import type { Metadata } from 'next';
import { ErrorBoundaryWrapper } from '@/components/error-boundary';

export const metadata: Metadata = {
  title: 'Authentication - Inbound Knowledge Base',
  description: 'Sign in or create an account to access the Inbound internal knowledge base',
};

/**
 * Authentication layout
 * Provides a centered card layout with branding for auth pages
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-primary-50 flex flex-col">
      {/* Header with branding */}
      <header className="w-full py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3">
            {/* Inbound logo placeholder - replace with actual logo */}
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-900 text-white font-bold text-xl">
              i
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-900">Inbound</h1>
              <p className="text-xs text-primary-600">Knowledge Base</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-md border border-primary-200 p-8">
            <ErrorBoundaryWrapper>
              {children}
            </ErrorBoundaryWrapper>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm text-primary-600">
          &copy; {new Date().getFullYear()} Inbound. Internal use only.
        </p>
      </footer>
    </div>
  );
}
