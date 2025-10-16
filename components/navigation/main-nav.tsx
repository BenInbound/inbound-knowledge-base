import Link from 'next/link';
import { Search, PlusCircle, HelpCircle, User, LogOut } from 'lucide-react';
import type { User as AuthUser } from '@/lib/types/auth';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/auth/actions';

interface MainNavProps {
  user: AuthUser;
}

export default function MainNav({ user }: MainNavProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary-200 bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        {/* Logo and Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary-900 flex items-center justify-center">
              <span className="text-white font-bold text-sm">IK</span>
            </div>
            <span className="text-xl font-semibold text-primary-900">
              Inbound Knowledge
            </span>
          </Link>

          {/* Primary Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-primary-700 hover:text-primary-900 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/search"
              className="text-sm font-medium text-primary-700 hover:text-primary-900 transition-colors"
            >
              Search
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
                  <img
                    src={user.profile.avatar_url}
                    alt={user.profile.full_name}
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
