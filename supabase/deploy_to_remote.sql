-- ===========================================================================
-- DEPLOYMENT SCRIPT FOR REMOTE SUPABASE DATABASE
-- ===========================================================================
-- This script combines all migrations and handles existing tables gracefully
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/bvyreoeaaqjwwclgkprh/sql
-- ===========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update user roles" ON profiles;
CREATE POLICY "Admins can update user roles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- RLS Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "Only admins can create categories" ON categories;
CREATE POLICY "Only admins can create categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Only admins can update categories" ON categories;
CREATE POLICY "Only admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Only admins can delete categories" ON categories;
CREATE POLICY "Only admins can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- ARTICLES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL,
  excerpt TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  author_id UUID NOT NULL REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0,
  search_vector tsvector,
  import_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_search ON articles USING GIN (search_vector);

-- RLS Policies
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published articles" ON articles;
CREATE POLICY "Anyone can view published articles"
  ON articles FOR SELECT
  TO authenticated
  USING (status = 'published' OR author_id = auth.uid());

DROP POLICY IF EXISTS "Authors can create articles" ON articles;
CREATE POLICY "Authors can create articles"
  ON articles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update own articles" ON articles;
CREATE POLICY "Authors can update own articles"
  ON articles FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Only admins can delete articles" ON articles;
CREATE POLICY "Only admins can delete articles"
  ON articles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- ARTICLE_CATEGORIES TABLE (Junction)
-- ============================================================================

CREATE TABLE IF NOT EXISTS article_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, category_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_article_categories_article ON article_categories(article_id);
CREATE INDEX IF NOT EXISTS idx_article_categories_category ON article_categories(category_id);

-- RLS Policies
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view article categories" ON article_categories;
CREATE POLICY "Anyone can view article categories"
  ON article_categories FOR SELECT
  TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "Authors can manage article categories" ON article_categories;
CREATE POLICY "Authors can manage article categories"
  ON article_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_categories.article_id
      AND articles.author_id = auth.uid()
    )
  );

-- ============================================================================
-- QUESTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  is_answered BOOLEAN NOT NULL DEFAULT FALSE,
  accepted_answer_id UUID,
  view_count INTEGER NOT NULL DEFAULT 0,
  search_vector tsvector,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_questions_author ON questions(author_id);
CREATE INDEX IF NOT EXISTS idx_questions_answered ON questions(is_answered);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_search ON questions USING GIN (search_vector);

-- RLS Policies
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view questions" ON questions;
CREATE POLICY "Anyone can view questions"
  ON questions FOR SELECT
  TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "Anyone can create questions" ON questions;
CREATE POLICY "Anyone can create questions"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update own questions" ON questions;
CREATE POLICY "Authors can update own questions"
  ON questions FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete own questions" ON questions;
CREATE POLICY "Authors can delete own questions"
  ON questions FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- ============================================================================
-- ANSWERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  is_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_author ON answers(author_id);
CREATE INDEX IF NOT EXISTS idx_answers_accepted ON answers(is_accepted);

-- RLS Policies
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view answers" ON answers;
CREATE POLICY "Anyone can view answers"
  ON answers FOR SELECT
  TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "Anyone can create answers" ON answers;
CREATE POLICY "Anyone can create answers"
  ON answers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update own answers" ON answers;
CREATE POLICY "Authors can update own answers"
  ON answers FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete own answers" ON answers;
CREATE POLICY "Authors can delete own answers"
  ON answers FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- ============================================================================
-- IMPORT_JOBS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS import_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  source TEXT NOT NULL,
  total_items INTEGER,
  processed_items INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  errors JSONB,
  metadata JSONB,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_by ON import_jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_at ON import_jobs(created_at DESC);

-- RLS Policies
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view import jobs" ON import_jobs;
CREATE POLICY "Only admins can view import jobs"
  ON import_jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Only admins can create import jobs" ON import_jobs;
CREATE POLICY "Only admins can create import jobs"
  ON import_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Only admins can update import jobs" ON import_jobs;
CREATE POLICY "Only admins can update import jobs"
  ON import_jobs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Email domain check function
CREATE OR REPLACE FUNCTION public.check_email_domain()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email NOT LIKE '%@inbound.no' THEN
    RAISE EXCEPTION 'Only @inbound.no email addresses are allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'member'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search function
CREATE OR REPLACE FUNCTION public.search_content(search_query TEXT)
RETURNS TABLE (
  type TEXT,
  id UUID,
  title TEXT,
  content TEXT,
  author_id UUID,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'article'::TEXT,
    a.id,
    a.title,
    a.excerpt,
    a.author_id,
    a.created_at,
    ts_rank(a.search_vector, plainto_tsquery('english', search_query)) AS rank
  FROM articles a
  WHERE a.status = 'published'
    AND a.search_vector @@ plainto_tsquery('english', search_query)

  UNION ALL

  SELECT
    'question'::TEXT,
    q.id,
    q.title,
    q.content,
    q.author_id,
    q.created_at,
    ts_rank(q.search_vector, plainto_tsquery('english', search_query)) AS rank
  FROM questions q
  WHERE q.search_vector @@ plainto_tsquery('english', search_query)

  ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update search vectors for articles
CREATE OR REPLACE FUNCTION public.update_article_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_article_search_vector_trigger ON articles;
CREATE TRIGGER update_article_search_vector_trigger
  BEFORE INSERT OR UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_article_search_vector();

-- Update search vectors for questions
CREATE OR REPLACE FUNCTION public.update_question_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_question_search_vector_trigger ON questions;
CREATE TRIGGER update_question_search_vector_trigger
  BEFORE INSERT OR UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_question_search_vector();

-- Email domain check trigger (on auth.users)
DROP TRIGGER IF EXISTS check_email_domain_trigger ON auth.users;
CREATE TRIGGER check_email_domain_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION check_email_domain();

-- Auto-create profile trigger (on auth.users)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- STORAGE BUCKET
-- ============================================================================

-- Create storage bucket for article images
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
DROP POLICY IF EXISTS "Public can view article images" ON storage.objects;
CREATE POLICY "Public can view article images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'article-images');

DROP POLICY IF EXISTS "Authenticated users can upload article images" ON storage.objects;
CREATE POLICY "Authenticated users can upload article images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'article-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own article images" ON storage.objects;
CREATE POLICY "Users can update own article images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'article-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own article images" ON storage.objects;
CREATE POLICY "Users can delete own article images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'article-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- IMAGE CLEANUP FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_article_images()
RETURNS TRIGGER AS $$
DECLARE
  old_images TEXT[];
  image_path TEXT;
BEGIN
  -- Extract image URLs from old content
  IF OLD.content IS NOT NULL THEN
    SELECT array_agg(DISTINCT url)
    INTO old_images
    FROM jsonb_array_elements(OLD.content->'content') AS content_block,
         jsonb_array_elements(content_block->'content') AS inline_content
    WHERE inline_content->>'type' = 'image'
      AND inline_content->>'src' LIKE '%/storage/v1/object/public/article-images/%'
      AND inline_content->>'src' ~ (OLD.author_id::text)
    CROSS JOIN LATERAL (
      SELECT substring(inline_content->>'src' FROM 'article-images/(.+)$') AS url
    ) AS extracted_url;

    -- Delete each image from storage
    IF old_images IS NOT NULL THEN
      FOREACH image_path IN ARRAY old_images
      LOOP
        DELETE FROM storage.objects
        WHERE bucket_id = 'article-images'
          AND name = image_path;
      END LOOP;
    END IF;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS cleanup_article_images_trigger ON articles;
CREATE TRIGGER cleanup_article_images_trigger
  BEFORE DELETE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_article_images();

-- ============================================================================
-- ENHANCED SEARCH WITH ANSWERS
-- ============================================================================

DROP FUNCTION IF EXISTS public.search_content(TEXT);

CREATE OR REPLACE FUNCTION public.search_content(search_query TEXT)
RETURNS TABLE (
  type TEXT,
  id UUID,
  title TEXT,
  content TEXT,
  author_id UUID,
  created_at TIMESTAMPTZ,
  rank REAL,
  answer_count BIGINT,
  is_answered BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  -- Articles
  SELECT
    'article'::TEXT,
    a.id,
    a.title,
    a.excerpt,
    a.author_id,
    a.created_at,
    ts_rank(a.search_vector, plainto_tsquery('english', search_query)) AS rank,
    0::BIGINT AS answer_count,
    FALSE AS is_answered
  FROM articles a
  WHERE a.status = 'published'
    AND a.search_vector @@ plainto_tsquery('english', search_query)

  UNION ALL

  -- Questions with answer counts
  SELECT
    'question'::TEXT,
    q.id,
    q.title,
    q.content,
    q.author_id,
    q.created_at,
    ts_rank(q.search_vector, plainto_tsquery('english', search_query)) AS rank,
    COUNT(ans.id) AS answer_count,
    q.is_answered
  FROM questions q
  LEFT JOIN answers ans ON ans.question_id = q.id
  WHERE q.search_vector @@ plainto_tsquery('english', search_query)
  GROUP BY q.id, q.title, q.content, q.author_id, q.created_at, q.search_vector, q.is_answered

  ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMPLETED
-- ============================================================================
-- All migrations have been applied successfully!
-- You can now update your .env.local file to use production Supabase credentials
-- ===========================================================================
