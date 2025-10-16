/**
 * Tettra Import API Endpoint
 * T146: Create POST /api/import/tettra endpoint
 * T155: Create import job record in import_jobs table when starting
 * T156: Update job status (pending → processing → completed/failed)
 * T157: Track import statistics (total, success, failed counts)
 * T158: Log detailed errors for failed imports in job errors field
 * Handles file upload, parsing, validation, and import of Tettra data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseCSV } from '@/lib/import/csv-parser';
import { parseJSON } from '@/lib/import/json-parser';
import { performDryRun } from '@/lib/import/validation';
import { importCategories } from '@/lib/import/category-importer';
import { importArticles } from '@/lib/import/article-importer';
import type { ParsedImportData, ImportError } from '@/lib/import/types';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  let jobId: string | null = null;

  try {

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const dryRun = formData.get('dryRun') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isJSON = fileName.endsWith('.json');

    if (!isCSV && !isJSON) {
      return NextResponse.json(
        { error: 'Invalid file type. Only CSV and JSON files are supported.' },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();

    if (!fileContent || fileContent.trim().length === 0) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      );
    }

    // Parse file
    let parsedData: ParsedImportData;

    try {
      if (isCSV) {
        parsedData = await parseCSV(fileContent);
      } else {
        parsedData = await parseJSON(fileContent);
      }
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Failed to parse file',
          details: (error as Error).message,
        },
        { status: 400 }
      );
    }

    // Perform dry-run validation if requested
    if (dryRun) {
      const dryRunResult = performDryRun(parsedData);

      return NextResponse.json({
        dryRun: true,
        valid: dryRunResult.valid,
        stats: {
          total: dryRunResult.stats.totalArticles + dryRunResult.stats.totalCategories,
          success: dryRunResult.stats.validArticles + dryRunResult.stats.validCategories,
          failed: (dryRunResult.stats.totalArticles - dryRunResult.stats.validArticles) +
                  (dryRunResult.stats.totalCategories - dryRunResult.stats.validCategories),
        },
        errors: dryRunResult.errors,
        warnings: dryRunResult.warnings,
        importedItems: [],
      });
    }

    // T155: Create import job record when starting actual import
    const { data: importJob, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        created_by: user.id,
        status: 'pending',
        file_name: file.name,
        stats: { total: 0, success: 0, failed: 0 },
        errors: [],
      })
      .select('id')
      .single();

    if (jobError || !importJob) {
      console.error('Failed to create import job:', jobError);
      return NextResponse.json(
        { error: 'Failed to create import job' },
        { status: 500 }
      );
    }

    jobId = importJob.id;

    // T156: Update job status to processing
    await supabase
      .from('import_jobs')
      .update({ status: 'processing' })
      .eq('id', jobId);

    // Perform actual import
    const importErrors: ImportError[] = [];
    const importedItems: Array<{
      type: 'article' | 'category';
      title: string;
      id: string;
    }> = [];

    // Import categories first (articles may reference them)
    if (parsedData.categories.length > 0) {
      const categoryResult = await importCategories(
        parsedData.categories,
        user.id
      );

      categoryResult.results.forEach(result => {
        if (result.success && result.id) {
          importedItems.push({
            type: 'category',
            title: result.title,
            id: result.id,
          });
        }
      });

      importErrors.push(...categoryResult.errors);
    }

    // Import articles
    if (parsedData.articles.length > 0) {
      const articleResult = await importArticles(
        parsedData.articles,
        user.id
      );

      articleResult.results.forEach(result => {
        if (result.success && result.id) {
          importedItems.push({
            type: 'article',
            title: result.title,
            id: result.id,
          });
        }
      });

      importErrors.push(...articleResult.errors);
    }

    // T157: Calculate statistics
    const totalItems = parsedData.articles.length + parsedData.categories.length;
    const successCount = importedItems.length;
    const failedCount = importErrors.length;

    const finalStats = {
      total: totalItems,
      success: successCount,
      failed: failedCount,
    };

    // T156 & T157 & T158: Update job with final status, stats, and errors
    const finalStatus = failedCount === totalItems ? 'failed' : 'completed';

    await supabase
      .from('import_jobs')
      .update({
        status: finalStatus,
        stats: finalStats,
        errors: importErrors,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    return NextResponse.json({
      dryRun: false,
      jobId,
      stats: finalStats,
      errors: importErrors,
      importedItems,
    });
  } catch (error) {
    console.error('Import error:', error);

    // T156 & T158: Mark job as failed if it was created
    if (jobId) {
      await supabase
        .from('import_jobs')
        .update({
          status: 'failed',
          errors: [
            {
              error: 'Import failed',
              details: (error as Error).message,
            },
          ],
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    }

    return NextResponse.json(
      {
        error: 'Import failed',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
