import Link from 'next/link';
import { FileText, Edit } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils/helpers';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'My Drafts | Internal Knowledge Base',
  description: 'View and manage your draft articles',
};

async function getUserDrafts() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Fetch user's draft and archived articles
  const { data: articles, error } = await supabase
    .from('articles')
    .select(
      `
      id,
      title,
      slug,
      excerpt,
      status,
      created_at,
      updated_at
    `
    )
    .eq('author_id', user.id)
    .in('status', ['draft', 'archived'])
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching drafts:', error);
    return [];
  }

  return articles || [];
}

export default async function MyDraftsPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const drafts = await getUserDrafts();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Drafts</h1>
            <p className="text-gray-600">
              Articles you&apos;ve saved as drafts or archived
            </p>
          </div>
          <Link href="/articles/new">
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              New Article
            </Button>
          </Link>
        </div>
      </div>

      {/* Drafts Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {drafts.length} draft{drafts.length === 1 ? '' : 's'} found
        </p>
      </div>

      {/* Drafts List */}
      {drafts.length > 0 ? (
        <div className="space-y-4">
          {drafts.map((draft) => (
            <Card
              key={draft.id}
              className="p-6 hover:shadow-lg hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {draft.title}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        draft.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {draft.status === 'draft' ? 'Draft' : 'Archived'}
                    </span>
                  </div>
                  {draft.excerpt && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {draft.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      Last edited {formatRelativeTime(draft.updated_at)}
                    </span>
                    <span>•</span>
                    <span>Created {formatRelativeTime(draft.created_at)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Link href={`/articles/${draft.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/articles/${draft.id}`}>
                    <Button variant="ghost" size="sm">
                      Preview
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No drafts yet
          </h3>
          <p className="text-sm text-gray-600 max-w-md mb-4">
            Start writing an article and save it as a draft to see it here.
          </p>
          <Link href="/articles/new">
            <Button>Create Article</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
