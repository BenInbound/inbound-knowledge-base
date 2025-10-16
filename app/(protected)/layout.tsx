import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/actions';
import MainNav from '@/components/navigation/main-nav';
import Sidebar from '@/components/navigation/sidebar';

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
      {/* Main Navigation Header */}
      <MainNav user={user} />

      {/* Two-column layout: Sidebar + Main content */}
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
