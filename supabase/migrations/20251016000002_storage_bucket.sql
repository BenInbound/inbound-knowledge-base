-- Migration: Configure Supabase Storage bucket for article images
-- Created: 2025-10-16
-- Purpose: Setup article-images bucket with RLS policies for secure image uploads

-- Create the storage bucket for article images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-images',
  'article-images',
  true, -- Public bucket (images are accessible via public URLs)
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- RLS Policies for article-images bucket

-- Policy: Authenticated users can upload images to their own folder
CREATE POLICY "Users can upload images to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'article-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Anyone can view images (public bucket)
CREATE POLICY "Anyone can view article images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'article-images');

-- Policy: Users can update their own images
CREATE POLICY "Users can update own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'article-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'article-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'article-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Comment explaining the bucket structure
COMMENT ON TABLE storage.objects IS 'Storage bucket for article images with RLS. Images are organized by user ID: {user_id}/{timestamp}-{random}.{ext}';
