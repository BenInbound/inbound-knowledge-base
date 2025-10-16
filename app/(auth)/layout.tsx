import type { Metadata } from 'next';
import Image from 'next/image';
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
      {/* Main content area */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-md border border-primary-200 p-8">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Image
                src="/inboundnett.svg"
                alt="Inbound"
                width={180}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </div>

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
