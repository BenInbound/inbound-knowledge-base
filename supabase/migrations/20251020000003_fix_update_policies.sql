-- Migration: Fix article UPDATE policies with WITH CHECK clause
-- Created: 2025-10-20
-- Purpose: Add WITH CHECK clauses to UPDATE policies to allow row modifications

-- Drop the existing policies that are missing WITH CHECK
DROP POLICY IF EXISTS "Authors can update own articles" ON articles;
DROP POLICY IF EXISTS "Admins can update any article" ON articles;

-- Recreate with both USING and WITH CHECK
CREATE POLICY "Authors can update own articles"
  ON articles FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Admins can update any article"
  ON articles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMENT ON POLICY "Authors can update own articles" ON articles IS
  'Allows article authors to update their own articles. WITH CHECK ensures author_id cannot be changed.';

COMMENT ON POLICY "Admins can update any article" ON articles IS
  'Allows administrators to edit any article, regardless of authorship.';
