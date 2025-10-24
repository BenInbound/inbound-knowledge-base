import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/actions';
import MainNav from '@/components/navigation/main-nav';
import Sidebar from '@/components/navigation/sidebar';
import { ErrorBoundaryWrapper } from '@/components/error-boundary';
import { CommandPaletteWrapper } from '@/components/ui/command-palette-wrapper';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Command Palette */}
      <CommandPaletteWrapper />

      {/* Main Navigation Header */}
      <ErrorBoundaryWrapper>
        <MainNav user={user} />
      </ErrorBoundaryWrapper>

      {/* Two-column layout: Sidebar + Main content */}
      <div className="flex">
        {/* Sidebar - Fixed position */}
        <ErrorBoundaryWrapper>
          <Sidebar />
        </ErrorBoundaryWrapper>

        {/* Main Content Area - With left margin to account for fixed sidebar */}
        <main className="flex-1 ml-80 p-8">
          <ErrorBoundaryWrapper>
            {children}
          </ErrorBoundaryWrapper>
        </main>
      </div>
    </div>
  );
}
