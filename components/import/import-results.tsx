'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ImportError {
  row?: number;
  item?: string;
  error: string;
}

interface ImportResultsProps {
  stats: {
    total: number;
    success: number;
    failed: number;
  };
  errors?: ImportError[];
  importedItems?: Array<{
    type: 'article' | 'category';
    title: string;
    id: string;
  }>;
}

/**
 * Import Results Display Component
 * Shows detailed results of Tettra import operation with errors and imported items
 * T144: Create import results display component
 */
export default function ImportResults({
  stats,
  errors = [],
  importedItems = [],
}: ImportResultsProps) {
  const successRate =
    stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Import Summary</CardTitle>
          <CardDescription>
            Overall results of the import operation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Success Rate */}
            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
              <span className="text-sm font-medium text-primary-900">
                Success Rate
              </span>
              <span className="text-2xl font-bold text-accent-600">
                {successRate}%
              </span>
            </div>

            {/* Stats Breakdown */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 border border-primary-200 rounded-lg">
                <div className="text-xl font-bold text-primary-900">
                  {stats.total}
                </div>
                <div className="text-xs text-primary-600 mt-1">
                  Total Items
                </div>
              </div>
              <div className="text-center p-3 border border-green-200 rounded-lg bg-green-50">
                <div className="text-xl font-bold text-green-600">
                  {stats.success}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Imported
                </div>
              </div>
              <div className="text-center p-3 border border-red-200 rounded-lg bg-red-50">
                <div className="text-xl font-bold text-red-600">
                  {stats.failed}
                </div>
                <div className="text-xs text-red-600 mt-1">
                  Failed
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Imported Items */}
      {importedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Successfully Imported</CardTitle>
            <CardDescription>
              {importedItems.length} item{importedItems.length !== 1 ? 's' : ''} imported
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {importedItems.map((item, index) => (
                <div
                  key={item.id || index}
                  className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                >
                  <div className="flex-shrink-0">
                    {item.type === 'article' ? (
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    ) : (
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
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-900 truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-green-600">
                      {item.type === 'article' ? 'Article' : 'Category'}
                    </p>
                  </div>
                  <svg
                    className="h-5 w-5 text-green-600 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Import Errors</CardTitle>
            <CardDescription>
              {errors.length} error{errors.length !== 1 ? 's' : ''} occurred during import
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {errors.map((error, index) => (
                <div
                  key={index}
                  className="p-3 bg-red-50 rounded-lg border border-red-200"
                >
                  <div className="flex items-start gap-2">
                    <svg
                      className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
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
                    <div className="flex-1">
                      {error.row && (
                        <p className="text-xs text-red-600 font-medium">
                          Row {error.row}
                          {error.item && ` - ${error.item}`}
                        </p>
                      )}
                      {!error.row && error.item && (
                        <p className="text-xs text-red-600 font-medium">
                          {error.item}
                        </p>
                      )}
                      <p className="text-sm text-red-900 mt-1">
                        {error.error}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
