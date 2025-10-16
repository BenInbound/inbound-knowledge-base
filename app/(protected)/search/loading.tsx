import { SearchResultsSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
      <div className="flex items-center justify-between">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <SearchResultsSkeleton count={6} />
    </div>
  );
}
