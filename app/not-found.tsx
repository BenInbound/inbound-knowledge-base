import Link from 'next/link';
import { FileQuestion, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <FileQuestion className="w-24 h-24 mx-auto text-gray-400" />
        </div>

        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Page Not Found
        </h2>

        <p className="text-gray-600 mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or never existed.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>

          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Search className="w-4 h-4" />
            Search Content
          </Link>
        </div>
      </div>
    </div>
  );
}
