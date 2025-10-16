'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, PlusCircle, HelpCircle, User, LogOut, FolderTree } from 'lucide-react';
import type { User as AuthUser } from '@/lib/types/auth';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/auth/actions';

interface MainNavProps {
  user: AuthUser;
}

export default function MainNav({ user }: MainNavProps) {
  const router = useRouter();

  // Keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        router.push('/search');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary-200 bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        {/* Logo and Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center">
            <Image
              src="/inboundnett.svg"
              alt="Inbound"
              width={158}
              height={32}
              className="w-[158px] h-auto"
              priority
            />
          </Link>

          {/* Primary Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/admin/categories"
              className="text-sm font-medium text-primary-700 hover:text-primary-900 transition-colors flex items-center gap-1"
            >
              <FolderTree className="h-4 w-4" />
              Categories
            </Link>
            <Link
              href="/qa"
              className="text-sm font-medium text-primary-700 hover:text-primary-900 transition-colors flex items-center gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              Q&A
            </Link>
          </nav>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {/* Quick Search Button */}
          <Link href="/search">
            <Button variant="ghost" size="sm" className="gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden lg:inline pointer-events-none h-5 select-none items-center gap-1 rounded border border-primary-300 bg-primary-100 px-1.5 font-mono text-xs font-medium text-primary-700">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </Link>

          {/* New Article Button */}
          <Link href="/articles/new">
            <Button variant="default" size="sm" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">New Article</span>
            </Button>
          </Link>

          {/* User Menu */}
          <div className="flex items-center gap-2 pl-4 border-l border-primary-200">
            {/* User Info */}
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-sm font-medium text-primary-900">
                {user.profile?.full_name || user.email}
              </span>
              <span className="text-xs text-primary-600">
                {user.profile?.role === 'admin' ? 'Admin' : 'Member'}
              </span>
            </div>

            {/* Avatar */}
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="rounded-full">
                {user.profile?.avatar_url ? (
                  <Image
                    src={user.profile.avatar_url}
                    alt={user.profile.full_name}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-primary-700" />
                )}
              </Button>
            </Link>

            {/* Logout */}
            <form action={logout}>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                title="Logout"
              >
                <LogOut className="h-5 w-5 text-primary-700" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
