'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';

interface ImportProgressProps {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stats?: {
    total: number;
    success: number;
    failed: number;
  };
  currentItem?: string;
}

/**
 * Import Progress Component
 * Displays real-time progress of Tettra data import operation
 * T143: Create import progress component
 */
export default function ImportProgress({
  status,
  stats = { total: 0, success: 0, failed: 0 },
  currentItem,
}: ImportProgressProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          color: 'text-primary-600',
          bgColor: 'bg-primary-100',
        };
      case 'processing':
        return {
          label: 'Processing',
          color: 'text-accent-600',
          bgColor: 'bg-accent-100',
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
        };
      case 'failed':
        return {
          label: 'Failed',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const progress = stats.total > 0
    ? ((stats.success + stats.failed) / stats.total) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Import Progress</span>
          <span
            className={`text-sm font-medium px-3 py-1 rounded-full ${statusDisplay.bgColor} ${statusDisplay.color}`}
          >
            {statusDisplay.label}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {status === 'processing' && (
          <div className="space-y-2">
            <div className="w-full bg-primary-200 rounded-full h-2.5">
              <div
                className="bg-accent-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-primary-600 text-center">
              {stats.success + stats.failed} of {stats.total} items processed
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <div className="text-2xl font-bold text-primary-900">
              {stats.total}
            </div>
            <div className="text-xs text-primary-600 mt-1">Total</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stats.success}
            </div>
            <div className="text-xs text-green-600 mt-1">Success</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {stats.failed}
            </div>
            <div className="text-xs text-red-600 mt-1">Failed</div>
          </div>
        </div>

        {/* Current Processing Item */}
        {status === 'processing' && currentItem && (
          <div className="flex items-center gap-3 p-4 bg-accent-50 rounded-lg">
            <LoadingSpinner className="h-5 w-5" />
            <div>
              <p className="text-sm font-medium text-primary-900">
                Processing
              </p>
              <p className="text-xs text-primary-600 truncate">
                {currentItem}
              </p>
            </div>
          </div>
        )}

        {/* Completion Message */}
        {status === 'completed' && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-medium text-green-900">
                Import completed successfully
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {status === 'failed' && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-medium text-red-900">
                Import failed
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
