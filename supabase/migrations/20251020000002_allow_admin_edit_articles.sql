-- Migration: Allow admins to edit and delete any article
-- Created: 2025-10-20
-- Purpose: Add RLS policies to allow admins to update any article, not just their own

-- Add policy allowing admins to update any article
CREATE POLICY "Admins can update any article"
  ON articles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add policy allowing admins to delete any article
-- (complements the existing "Authors can delete own articles" policy from 20251020000001)
CREATE POLICY "Admins can delete any article"
  ON articles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMENT ON POLICY "Admins can update any article" ON articles IS
  'Allows administrators to edit any article, regardless of authorship.';

COMMENT ON POLICY "Admins can delete any article" ON articles IS
  'Allows administrators to delete any article, regardless of authorship.';
