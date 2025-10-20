-- Migration: Fix article deletion
-- Created: 2025-10-20
-- Purpose:
--   1. Update RLS policy to allow authors to delete their own articles (not just admins)
--   2. Drop the database trigger for image cleanup (replaced by application-level cleanup)

-- Drop the old admin-only delete policy
DROP POLICY IF EXISTS "Only admins can delete articles" ON articles;

-- Create new policy allowing authors to delete their own articles
CREATE POLICY "Authors can delete own articles"
  ON articles FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Drop the image cleanup trigger and functions
-- These are replaced by application-level cleanup in the DELETE API endpoint
-- The trigger doesn't work reliably on remote Supabase instances because it tries
-- to directly manipulate the storage.objects table, which is not allowed
DROP TRIGGER IF EXISTS delete_article_images_trigger ON articles;
DROP FUNCTION IF EXISTS delete_article_images();
DROP FUNCTION IF EXISTS extract_image_paths_from_content(JSONB);

COMMENT ON POLICY "Authors can delete own articles" ON articles IS
  'Allows article authors to delete their own articles. Image cleanup is handled by the application layer using the Supabase Storage API.';
