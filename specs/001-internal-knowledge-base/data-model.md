# Data Model: Internal Knowledge Base

**Feature**: Internal Knowledge Base Platform
**Date**: 2025-10-16
**Database**: Supabase PostgreSQL 15.x

## Overview

This document defines the database schema, entities, relationships, and validation rules for the knowledge base platform. The schema is designed to support hierarchical categories, rich text articles, Q&A functionality, and Tettra data import.

---

## Entity Relationship Diagram

```
┌─────────────────┐
│  auth.users     │ (Supabase Auth table)
│  - id (uuid)    │
│  - email        │
└────────┬────────┘
         │
         │ 1:N
         │
         ├──────────────────┬──────────────────┬──────────────────┐
         │                  │                  │                  │
         ▼                  ▼                  ▼                  ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│   profiles     │ │   articles     │ │   questions    │ │  import_jobs   │
│  - id (uuid)   │ │  - id (uuid)   │ │  - id (uuid)   │ │  - id (uuid)   │
│  - user_id     │ │  - author_id   │ │  - author_id   │ │  - created_by  │
│  - full_name   │ │  - title       │ │  - title       │ │  - status      │
│  - role        │ │  - content     │ │  - body        │ │  - stats       │
└────────────────┘ │  - status      │ │  - is_answered │ └────────────────┘
                   │  - created_at  │ │  - created_at  │
                   │  - updated_at  │ └────────┬───────┘
                   └────────┬───────┘          │
                            │                  │ 1:N
                            │                  ▼
                            │         ┌────────────────┐
                            │         │    answers     │
                            │         │  - id (uuid)   │
                            │         │  - question_id │
                            │         │  - author_id   │
                            │         │  - content     │
                            │         │  - is_accepted │
                            │         └────────────────┘
                            │
                            │ N:M
                            │
                   ┌────────▼───────┐
                   │ article_       │
                   │ categories     │
                   │  - article_id  │
                   │  - category_id │
                   └────────┬───────┘
                            │
                            │ N:1
                            ▼
                   ┌────────────────┐
                   │  categories    │
                   │  - id (uuid)   │
                   │  - name        │
                   │  - parent_id   │ ──┐
                   │  - sort_order  │   │ Self-referencing
                   └────────────────┘   │ (hierarchy)
                            ▲           │
                            └───────────┘
```

---

## Table Definitions

### profiles

User profile information extending Supabase auth.users.

```sql
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
```

**Fields**:
- `id`: UUID, primary key, references auth.users
- `full_name`: User's display name (required)
- `role`: `admin` or `member` (default: member)
- `avatar_url`: Optional profile picture URL
- `created_at`: Timestamp of profile creation
- `updated_at`: Last update timestamp

**Validation Rules**:
- `full_name` must not be empty
- `role` must be 'admin' or 'member'
- Email domain validated in auth hook (see Auth Implementation)

---

### categories

Hierarchical organization structure for articles.

```sql
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
```

**Fields**:
- `id`: UUID, primary key
- `name`: Category display name (required)
- `slug`: URL-friendly identifier (unique, required)
- `description`: Optional category description
- `parent_id`: Optional reference to parent category (null = root)
- `sort_order`: Integer for manual ordering (default: 0)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

**Validation Rules**:
- `name` must not be empty (1-100 characters)
- `slug` must be unique, lowercase, alphanumeric with hyphens
- `parent_id` cannot reference self (prevent cycles)
- Maximum nesting depth: 3 levels (enforced in application)

**State Transitions**: None (static organizational structure)

---

### articles

Knowledge base content with rich text and full-text search.

```sql
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
  import_metadata JSONB, -- Tettra import reference

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
```

**Fields**:
- `id`: UUID, primary key
- `title`: Article title (required, 1-200 characters)
- `slug`: URL-friendly identifier (unique, required)
- `content`: JSONB, TipTap editor output (required)
- `excerpt`: Optional short summary (auto-generated from content first paragraph)
- `status`: Enum: `draft`, `published`, `archived` (default: draft)
- `author_id`: UUID reference to auth.users (required)
- `published_at`: Timestamp when first published (null for drafts)
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp
- `view_count`: Integer tracking views (default: 0)
- `import_metadata`: Optional JSONB with Tettra import data
- `search_vector`: Generated tsvector for full-text search

**Validation Rules**:
- `title` length: 1-200 characters
- `slug` must be unique, lowercase, alphanumeric with hyphens
- `content` must be valid TipTap JSON structure
- `status` must be 'draft', 'published', or 'archived'
- `published_at` auto-set when status changes to 'published'

**State Transitions**:
```
draft -> published -> archived
  ↑                      ↓
  └──────────────────────┘
```

---

### article_categories

Join table for many-to-many relationship between articles and categories.

```sql
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
```

**Fields**:
- `article_id`: UUID reference to articles (required)
- `category_id`: UUID reference to categories (required)
- `created_at`: Timestamp of association

**Validation Rules**:
- An article can belong to multiple categories (no limit initially)
- A category can contain multiple articles
- Composite primary key prevents duplicates

---

### questions

Q&A system for unanswered questions.

```sql
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
```

**Fields**:
- `id`: UUID, primary key
- `title`: Question title (required, 1-200 characters)
- `body`: Question details (required)
- `author_id`: UUID reference to auth.users (required)
- `is_answered`: Boolean flag (default: false)
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp
- `search_vector`: Generated tsvector for full-text search

**Validation Rules**:
- `title` length: 1-200 characters
- `body` must not be empty
- `is_answered` auto-set to true when accepted answer exists

---

### answers

Responses to questions in Q&A system.

```sql
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

-- Ensure only one accepted answer per question
CREATE UNIQUE INDEX idx_one_accepted_answer_per_question
  ON answers(question_id)
  WHERE is_accepted = TRUE;

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
```

**Fields**:
- `id`: UUID, primary key
- `question_id`: UUID reference to questions (required)
- `author_id`: UUID reference to auth.users (required)
- `content`: Answer text (required)
- `is_accepted`: Boolean flag for accepted answer (default: false)
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Validation Rules**:
- `content` must not be empty
- Only one accepted answer per question (enforced by unique index)
- Setting `is_accepted = TRUE` auto-updates question's `is_answered`

---

### import_jobs

Tracking Tettra data import operations.

```sql
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
```

**Fields**:
- `id`: UUID, primary key
- `created_by`: UUID reference to auth.users (admin only)
- `status`: Enum: `pending`, `processing`, `completed`, `failed`
- `file_name`: Original import file name
- `stats`: JSONB with counts (total, success, failed)
- `errors`: Optional JSONB array of error details
- `started_at`: Timestamp when processing began
- `completed_at`: Timestamp when finished
- `created_at`: Creation timestamp

**State Transitions**:
```
pending -> processing -> completed
                      -> failed
```

---

## Authentication Implementation

### Email Domain Restriction

Supabase Auth Hook to enforce @inbound.no domain:

```sql
CREATE OR REPLACE FUNCTION auth.check_email_domain()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email NOT LIKE '%@inbound.no' THEN
    RAISE EXCEPTION 'Access is restricted to @inbound.no email addresses only'
      USING HINT = 'Please use your Inbound company email address';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_email_domain_on_signup
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.check_email_domain();
```

This ensures @inbound.no restriction at the database level, impossible to bypass.

---

## Search Implementation

### Full-Text Search Function

```sql
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
```

Usage: `SELECT * FROM search_content('search terms here');`

---

## Migrations Strategy

All schema changes will be version-controlled using Supabase migrations:

```bash
# Create new migration
supabase migration new initial_schema

# Apply migrations locally
supabase db push

# Apply to production
supabase db push --linked
```

Migration files will be stored in `/supabase/migrations/` directory.

---

## Seeding Strategy

Development seed data in `/supabase/seed.sql`:

- 3-5 sample categories (nested structure)
- 10-15 sample articles (mix of drafts and published)
- 2-3 sample questions with answers
- Test users with @inbound.no emails

---

## Performance Considerations

1. **Indexes**: All foreign keys indexed, full-text search GIN indexes
2. **Generated Columns**: `search_vector` auto-maintained, no application logic needed
3. **RLS Performance**: Policies use indexed columns (id, user_id, status)
4. **Query Optimization**: Use `LIMIT` on searches, paginate large result sets
5. **Connection Pooling**: Supabase provides PgBouncer by default

---

## Backup & Recovery

- **Point-in-Time Recovery**: Enable on Supabase project (last 7 days)
- **Daily Backups**: Automated by Supabase
- **Export Strategy**: Regular exports to S3 for long-term archival

---

## Next Steps

1. Create migration files for each table
2. Define API contracts using this schema
3. Implement RLS policies testing
4. Create seed data for development
5. Set up Supabase project and apply migrations
