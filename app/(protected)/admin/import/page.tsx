'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import FileUpload from '@/components/import/file-upload';
import ImportProgress from '@/components/import/import-progress';
import ImportResults from '@/components/import/import-results';
import ImportHistory from '@/components/import/import-history';

/**
 * Import Page (Admin Only)
 * T141: Create import page with all import components integrated
 * T145: Add dry-run mode toggle to import form
 */
export default function ImportPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDryRun, setIsDryRun] = useState(true);
  const [importStatus, setImportStatus] = useState<
    'idle' | 'pending' | 'processing' | 'completed' | 'failed'
  >('idle');
  const [importStats, setImportStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
  });
  const [importErrors, setImportErrors] = useState<
    Array<{ row?: number; item?: string; error: string }>
  >([]);
  const [importedItems, setImportedItems] = useState<
    Array<{ type: 'article' | 'category'; title: string; id: string }>
  >([]);
  const [currentItem, setCurrentItem] = useState<string>('');
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    // Reset previous import state
    setImportStatus('idle');
    setImportStats({ total: 0, success: 0, failed: 0 });
    setImportErrors([]);
    setImportedItems([]);
  };

  const handleStartImport = async () => {
    if (!selectedFile) return;

    setImportStatus('processing');
    setImportErrors([]);
    setImportedItems([]);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('dryRun', isDryRun.toString());

    try {
      const response = await fetch('/api/import/tettra', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setImportStatus('failed');
        setImportErrors([
          {
            error: result.error || 'Import failed. Please try again.',
          },
        ]);
        return;
      }

      // Update final stats
      setImportStats({
        total: result.stats.total,
        success: result.stats.success,
        failed: result.stats.failed,
      });

      if (result.errors && result.errors.length > 0) {
        setImportErrors(result.errors);
      }

      if (result.importedItems && result.importedItems.length > 0) {
        setImportedItems(result.importedItems);
      }

      setImportStatus(result.stats.failed > 0 ? 'completed' : 'completed');

      // Refresh import history after completion
      setHistoryRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus('failed');
      setImportErrors([
        {
          error: 'An unexpected error occurred. Please check your connection and try again.',
        },
      ]);

      // Refresh import history even on error
      setHistoryRefreshKey(prev => prev + 1);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImportStatus('idle');
    setImportStats({ total: 0, success: 0, failed: 0 });
    setImportErrors([]);
    setImportedItems([]);
    setCurrentItem('');
    setIsDryRun(true);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-900">
              Import Tettra Data
            </h1>
            <p className="text-primary-600 mt-2">
              Import articles and categories from your Tettra export file
            </p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
        </div>

        {/* Import Form */}
        {importStatus === 'idle' && (
          <div className="space-y-6">
            {/* File Upload */}
            <FileUpload
              onFileSelect={handleFileSelect}
              acceptedFormats={['.csv', '.json']}
              maxSizeMB={10}
            />

            {/* Dry Run Toggle - T145 */}
            {selectedFile && (
              <Card>
                <CardHeader>
                  <CardTitle>Import Options</CardTitle>
                  <CardDescription>
                    Configure how the import should be processed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="dry-run"
                      checked={isDryRun}
                      onChange={(e) => setIsDryRun(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-primary-300 text-accent-600 focus:ring-accent-500"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="dry-run"
                        className="text-sm font-medium text-primary-900 cursor-pointer"
                      >
                        Dry Run Mode (Recommended)
                      </Label>
                      <p className="text-sm text-primary-600 mt-1">
                        Validate the import file without creating any records.
                        This allows you to check for errors before performing
                        the actual import.
                      </p>
                      {isDryRun && (
                        <div className="mt-2 p-3 bg-accent-50 border border-accent-200 rounded-lg">
                          <p className="text-xs text-accent-800">
                            <strong>Note:</strong> No data will be imported in
                            dry-run mode. You can review the results and run the
                            import again with this option disabled.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Start Import Button */}
            {selectedFile && (
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleReset}>
                  Cancel
                </Button>
                <Button onClick={handleStartImport}>
                  {isDryRun ? 'Validate Import' : 'Start Import'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Progress Display */}
        {(importStatus === 'processing' ||
          importStatus === 'pending') && (
          <ImportProgress
            status={importStatus}
            stats={importStats}
            currentItem={currentItem}
          />
        )}

        {/* Results Display */}
        {(importStatus === 'completed' || importStatus === 'failed') && (
          <div className="space-y-4">
            {importStatus === 'completed' && (
              <ImportProgress
                status={importStatus}
                stats={importStats}
              />
            )}

            <ImportResults
              stats={importStats}
              errors={importErrors}
              importedItems={importedItems}
            />

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleReset}>
                Import Another File
              </Button>
              {isDryRun && importStatus === 'completed' && importErrors.length === 0 && (
                <Button
                  onClick={() => {
                    setIsDryRun(false);
                    setImportStatus('idle');
                  }}
                >
                  Proceed with Import
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Import History Section - T160 */}
        <ImportHistory key={historyRefreshKey} />
      </div>
    </div>
  );
}
