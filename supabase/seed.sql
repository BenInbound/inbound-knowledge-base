-- Seed Data for Development
-- Run this after migrations to populate test data

-- Note: Users must be created through Supabase Auth (cannot insert directly)
-- Use Supabase Dashboard or CLI to create test users with @inbound.no emails

-- ============================================================================
-- CATEGORIES
-- ============================================================================

INSERT INTO categories (id, name, slug, description, parent_id, sort_order) VALUES
  -- Root categories
  ('11111111-1111-1111-1111-111111111111', 'Getting Started', 'getting-started', 'Essential information for new team members', NULL, 1),
  ('22222222-2222-2222-2222-222222222222', 'Engineering', 'engineering', 'Technical documentation and development guides', NULL, 2),
  ('33333333-3333-3333-3333-333333333333', 'Design', 'design', 'Design system, brand guidelines, and creative resources', NULL, 3),
  ('44444444-4444-4444-4444-444444444444', 'Operations', 'operations', 'Company processes and operational procedures', NULL, 4),

  -- Subcategories under Getting Started
  ('11111111-1111-1111-1111-111111111112', 'Onboarding', 'onboarding', 'First steps for new employees', '11111111-1111-1111-1111-111111111111', 1),
  ('11111111-1111-1111-1111-111111111113', 'Company Culture', 'company-culture', 'Our values, mission, and team practices', '11111111-1111-1111-1111-111111111111', 2),

  -- Subcategories under Engineering
  ('22222222-2222-2222-2222-222222222223', 'Development Setup', 'development-setup', 'Setting up your development environment', '22222222-2222-2222-2222-222222222222', 1),
  ('22222222-2222-2222-2222-222222222224', 'Code Standards', 'code-standards', 'Coding conventions and best practices', '22222222-2222-2222-2222-222222222222', 2),
  ('22222222-2222-2222-2222-222222222225', 'Architecture', 'architecture', 'System architecture and technical decisions', '22222222-2222-2222-2222-222222222222', 3),

  -- Subcategories under Design
  ('33333333-3333-3333-3333-333333333334', 'Design System', 'design-system', 'UI components and design tokens', '33333333-3333-3333-3333-333333333333', 1),
  ('33333333-3333-3333-3333-333333333335', 'Brand Guidelines', 'brand-guidelines', 'Logo usage, colors, and typography', '33333333-3333-3333-3333-333333333333', 2);

-- Note: Articles cannot be seeded without real user IDs from auth.users
-- Create test articles through the UI after creating test users

-- ============================================================================
-- SAMPLE ARTICLES (Template - requires real author_id from auth.users)
-- ============================================================================

-- To create sample articles, first create a test user via Supabase Auth:
-- supabase auth signup --email test@inbound.no --password testpass123
-- Then get the user ID and use it below

-- Example structure (uncomment and replace USER_ID after creating test user):
/*
INSERT INTO articles (id, title, slug, content, excerpt, status, author_id, published_at) VALUES
  (
    '55555555-5555-5555-5555-555555555551',
    'Welcome to Inbound Knowledge Base',
    'welcome-to-inbound-kb',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Welcome!"}]},{"type":"paragraph","content":[{"type":"text","text":"This is our internal knowledge base where we document everything important about working at Inbound.no"}]}]}',
    'Welcome to our internal knowledge base',
    'published',
    'USER_ID_HERE',
    NOW()
  ),
  (
    '55555555-5555-5555-5555-555555555552',
    'Setting Up Your Development Environment',
    'dev-environment-setup',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Development Setup"}]},{"type":"paragraph","content":[{"type":"text","text":"Follow these steps to get your local development environment ready."}]}]}',
    'Guide to setting up your development environment',
    'published',
    'USER_ID_HERE',
    NOW()
  );

-- Link articles to categories
INSERT INTO article_categories (article_id, category_id) VALUES
  ('55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111111'),
  ('55555555-5555-5555-5555-555555555552', '22222222-2222-2222-2222-222222222223');
*/

-- ============================================================================
-- SAMPLE QUESTIONS (Template - requires real author_id)
-- ============================================================================

/*
INSERT INTO questions (title, body, author_id) VALUES
  (
    'How do I access the staging environment?',
    'I need to test my changes on staging but I am not sure what the URL is or how to get access.',
    'USER_ID_HERE'
  ),
  (
    'What is our code review process?',
    'I have my first PR ready. What are the steps for getting it reviewed and merged?',
    'USER_ID_HERE'
  );
*/
