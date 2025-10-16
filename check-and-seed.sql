-- Check if categories exist and seed if needed
SELECT COUNT(*) as category_count FROM categories;

-- If categories are empty, insert them (will only insert if they don't exist due to unique constraints)
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
  ('33333333-3333-3333-3333-333333333335', 'Brand Guidelines', 'brand-guidelines', 'Logo usage, colors, and typography', '33333333-3333-3333-3333-333333333333', 2)
ON CONFLICT (id) DO NOTHING;

-- Show final count
SELECT COUNT(*) as final_category_count FROM categories;

-- Check if articles exist
SELECT COUNT(*) as article_count FROM articles;

-- Check if users exist
SELECT COUNT(*) as user_count FROM auth.users;
