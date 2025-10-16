'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Import History Component
 * T160: Display import history on import page
 * Shows a list of all previous import operations with status and stats
 */

interface ImportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileName: string;
  stats: {
    total: number;
    success: number;
    failed: number;
  };
  createdBy: {
    fullName: string;
    email: string;
  } | null;
  createdAt: string;
  completedAt: string | null;
  hasErrors: boolean;
}

interface ImportHistoryProps {
  onRefresh?: () => void;
}

export default function ImportHistory({ onRefresh }: ImportHistoryProps) {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchJobs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/import/jobs?limit=${limit}&offset=${page * limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch import history');
      }

      const data = await response.json();
      setJobs(data.jobs);
      setTotal(data.total);
    } catch (err) {
      console.error('Error fetching import history:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page]);

  const handleRefresh = () => {
    fetchJobs();
    onRefresh?.();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      processing: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      failed: 'bg-red-100 text-red-800 border-red-300',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          statusColors[status as keyof typeof statusColors]
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getDuration = (createdAt: string, completedAt: string | null) => {
    if (!completedAt) return 'In progress...';

    const start = new Date(createdAt).getTime();
    const end = new Date(completedAt).getTime();
    const durationSeconds = Math.floor((end - start) / 1000);

    if (durationSeconds < 60) {
      return `${durationSeconds}s`;
    } else if (durationSeconds < 3600) {
      return `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`;
    } else {
      return `${Math.floor(durationSeconds / 3600)}h ${Math.floor((durationSeconds % 3600) / 60)}m`;
    }
  };

  if (isLoading && jobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
          <CardDescription>View previous import operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-primary-600">Loading import history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
          <CardDescription>View previous import operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={handleRefresh}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Import History</CardTitle>
          <CardDescription>View previous import operations</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-primary-600">No import history available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Jobs List */}
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-primary-200 rounded-lg p-4 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      {/* File Name and Status */}
                      <div className="flex items-center gap-3">
                        <h4 className="text-sm font-medium text-primary-900 truncate">
                          {job.fileName}
                        </h4>
                        {getStatusBadge(job.status)}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-primary-600">
                        <span>
                          Total: <strong>{job.stats.total}</strong>
                        </span>
                        <span className="text-green-600">
                          Success: <strong>{job.stats.success}</strong>
                        </span>
                        {job.stats.failed > 0 && (
                          <span className="text-red-600">
                            Failed: <strong>{job.stats.failed}</strong>
                          </span>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-primary-500">
                        {job.createdBy && (
                          <span>by {job.createdBy.fullName}</span>
                        )}
                        <span>{formatDate(job.createdAt)}</span>
                        <span>Duration: {getDuration(job.createdAt, job.completedAt)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    {job.hasErrors && job.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/api/import/jobs/${job.id}`, '_blank')}
                      >
                        View Errors
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {total > limit && (
              <div className="flex items-center justify-between pt-4 border-t border-primary-200">
                <p className="text-sm text-primary-600">
                  Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} imports
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={(page + 1) * limit >= total}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
