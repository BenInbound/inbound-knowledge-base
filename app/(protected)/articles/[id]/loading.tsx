import { ArticleDetailSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto">
      <ArticleDetailSkeleton />
    </div>
  );
}
