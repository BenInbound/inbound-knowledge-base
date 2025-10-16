-- Initial Schema Migration for Internal Knowledge Base
-- Created: 2025-10-16

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_role ON profiles(role);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    'member'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent circular references
  CONSTRAINT no_self_reference CHECK (id != parent_id)
);

-- Indexes
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_sort ON categories(sort_order);

-- RLS Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (TRUE);

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

CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '{"type":"doc","content":[]}',
  excerpt TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  view_count INTEGER NOT NULL DEFAULT 0,
  import_metadata JSONB,

  -- Full-text search
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content::text, '')), 'C')
  ) STORED
);

-- Indexes
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published ON articles(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_search ON articles USING GIN(search_vector);

-- RLS Policies
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published articles"
  ON articles FOR SELECT
  TO authenticated
  USING (status = 'published' OR author_id = auth.uid());

CREATE POLICY "Authors can create articles"
  ON articles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own articles"
  ON articles FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

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

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-set published_at when status changes to published
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_set_published_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION set_published_at();

-- ============================================================================
-- ARTICLE_CATEGORIES TABLE
-- ============================================================================

CREATE TABLE article_categories (
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (article_id, category_id)
);

-- Indexes
CREATE INDEX idx_article_categories_article ON article_categories(article_id);
CREATE INDEX idx_article_categories_category ON article_categories(category_id);

-- RLS Policies
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view article-category links"
  ON article_categories FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Authors can manage own article categories"
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

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_answered BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Full-text search
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B')
  ) STORED
);

-- Indexes
CREATE INDEX idx_questions_author ON questions(author_id);
CREATE INDEX idx_questions_answered ON questions(is_answered);
CREATE INDEX idx_questions_created ON questions(created_at DESC);
CREATE INDEX idx_questions_search ON questions USING GIN(search_vector);

-- RLS Policies
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions"
  ON questions FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Authors can create questions"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own questions"
  ON questions FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own questions"
  ON questions FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Update trigger
CREATE TRIGGER questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ANSWERS TABLE
-- ============================================================================

CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_answers_author ON answers(author_id);
CREATE INDEX idx_answers_accepted ON answers(is_accepted) WHERE is_accepted = TRUE;

-- Ensure only one accepted answer per question
CREATE UNIQUE INDEX idx_one_accepted_answer_per_question
  ON answers(question_id)
  WHERE is_accepted = TRUE;

-- RLS Policies
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view answers"
  ON answers FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Authors can create answers"
  ON answers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own answers"
  ON answers FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own answers"
  ON answers FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Update trigger
CREATE TRIGGER answers_updated_at
  BEFORE UPDATE ON answers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-mark question as answered when accepted answer exists
CREATE OR REPLACE FUNCTION update_question_answered()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_accepted = TRUE THEN
    UPDATE questions
    SET is_answered = TRUE
    WHERE id = NEW.question_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER answers_mark_question_answered
  AFTER INSERT OR UPDATE ON answers
  FOR EACH ROW
  WHEN (NEW.is_accepted = TRUE)
  EXECUTE FUNCTION update_question_answered();

-- ============================================================================
-- IMPORT_JOBS TABLE
-- ============================================================================

CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_name TEXT NOT NULL,
  stats JSONB NOT NULL DEFAULT '{"total":0,"success":0,"failed":0}',
  errors JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_import_jobs_created_by ON import_jobs(created_by);
CREATE INDEX idx_import_jobs_status ON import_jobs(status);
CREATE INDEX idx_import_jobs_created ON import_jobs(created_at DESC);

-- RLS Policies
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

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

-- ============================================================================
-- SEARCH FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION search_content(search_query TEXT)
RETURNS TABLE (
  type TEXT,
  id UUID,
  title TEXT,
  excerpt TEXT,
  rank REAL,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'article'::TEXT as type,
    a.id,
    a.title,
    a.excerpt,
    ts_rank(a.search_vector, websearch_to_tsquery('english', search_query)) as rank,
    a.created_at
  FROM articles a
  WHERE a.status = 'published'
    AND a.search_vector @@ websearch_to_tsquery('english', search_query)

  UNION ALL

  SELECT
    'question'::TEXT as type,
    q.id,
    q.title,
    LEFT(q.body, 200) as excerpt,
    ts_rank(q.search_vector, websearch_to_tsquery('english', search_query)) as rank,
    q.created_at
  FROM questions q
  WHERE q.search_vector @@ websearch_to_tsquery('english', search_query)

  ORDER BY rank DESC, created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- EMAIL DOMAIN RESTRICTION
-- ============================================================================
-- Note: Email domain restriction (@inbound.no) will be enforced via:
-- 1. Application-level validation in signup forms
-- 2. Supabase Auth Hook (configured separately in Dashboard > Authentication > Hooks)
--
-- To set up Auth Hook in Supabase Dashboard:
-- 1. Go to Authentication > Hooks
-- 2. Enable "Validate Email" hook
-- 3. Use this SQL function:
--
-- CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
-- RETURNS jsonb
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   IF event->'claims'->>'email' NOT LIKE '%@inbound.no' THEN
--     RAISE EXCEPTION 'Access is restricted to @inbound.no email addresses only';
--   END IF;
--   RETURN event;
-- END;
-- $$;
