'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchInput } from '@/components/search/search-input';
import { SearchResults } from '@/components/search/search-results';
import { Loading } from '@/components/ui/loading';
import type { SearchResult } from '@/lib/types/database';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performSearch = async () => {
      if (!query || query.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Search failed');
        }

        const data = await response.json();
        setResults(data.results || []);
      } catch (err) {
        console.error('Search error:', err);
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Search Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Search</h1>
          <p className="text-gray-600">
            Search through articles and Q&A to find what you need
          </p>
        </div>

        {/* Search Input */}
        <SearchInput value={query} onChange={setQuery} autoFocus />

        {/* Search Results */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loading />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        {!isLoading && !error && query.trim().length >= 2 && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              {results.length === 0
                ? 'No results found'
                : `Found ${results.length} result${results.length === 1 ? '' : 's'}`}
            </div>
            <SearchResults results={results} query={query} />
          </div>
        )}

        {!query && !isLoading && (
          <div className="text-center py-12 text-gray-500">
            Enter a search term to find articles and questions
          </div>
        )}

        {query.trim().length > 0 && query.trim().length < 2 && !isLoading && (
          <div className="text-center py-12 text-gray-500">
            Please enter at least 2 characters to search
          </div>
        )}
      </div>
    </div>
  );
}
