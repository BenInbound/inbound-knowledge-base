-- Migration: Handle image deletion when article is deleted
-- Created: 2025-10-16
-- Purpose: Automatically clean up article images from storage when articles are deleted

-- Function to extract image paths from TipTap article content
-- This function parses the JSONB content and finds all image nodes
CREATE OR REPLACE FUNCTION extract_image_paths_from_content(content JSONB)
RETURNS TEXT[] AS $$
DECLARE
  paths TEXT[] := ARRAY[]::TEXT[];
  node JSONB;
BEGIN
  -- Iterate through content nodes recursively
  FOR node IN SELECT jsonb_array_elements(content->'content')
  LOOP
    -- Check if node is an image
    IF node->>'type' = 'image' THEN
      -- Extract the src attribute and convert to storage path
      -- Format: https://{project}.supabase.co/storage/v1/object/public/article-images/{path}
      -- We need to extract just the {path} part
      DECLARE
        src TEXT := node->'attrs'->>'src';
        path TEXT;
      BEGIN
        IF src IS NOT NULL AND src LIKE '%/storage/v1/object/public/article-images/%' THEN
          -- Extract path after 'article-images/'
          path := substring(src from 'article-images/(.+)$');
          IF path IS NOT NULL THEN
            paths := array_append(paths, path);
          END IF;
        END IF;
      END;
    END IF;

    -- Recursively check nested content (for lists, blockquotes, etc.)
    IF node ? 'content' THEN
      paths := paths || extract_image_paths_from_content(node);
    END IF;
  END LOOP;

  RETURN paths;
END;
$$ LANGUAGE plpgsql;

-- Function to delete images from storage
-- This function is called by the trigger when an article is deleted
CREATE OR REPLACE FUNCTION delete_article_images()
RETURNS TRIGGER AS $$
DECLARE
  image_paths TEXT[];
  path TEXT;
BEGIN
  -- Extract image paths from the deleted article's content
  image_paths := extract_image_paths_from_content(OLD.content);

  -- Delete each image from storage
  IF array_length(image_paths, 1) > 0 THEN
    FOREACH path IN ARRAY image_paths
    LOOP
      -- Delete from storage.objects
      DELETE FROM storage.objects
      WHERE bucket_id = 'article-images'
        AND name = path;
    END LOOP;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically delete article images when an article is deleted
DROP TRIGGER IF EXISTS delete_article_images_trigger ON articles;
CREATE TRIGGER delete_article_images_trigger
  BEFORE DELETE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION delete_article_images();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION extract_image_paths_from_content(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_article_images() TO authenticated;

COMMENT ON FUNCTION extract_image_paths_from_content IS 'Extracts image storage paths from TipTap article content (JSONB)';
COMMENT ON FUNCTION delete_article_images IS 'Deletes article images from storage when an article is deleted (called by trigger)';
