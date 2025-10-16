-- Create sample articles for test@inbound.no user
INSERT INTO articles (id, title, slug, content, excerpt, status, author_id, published_at) VALUES
  (
    '55555555-5555-5555-5555-555555555551',
    'Welcome to Inbound Knowledge Base',
    'welcome-to-inbound-kb',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Welcome to Inbound Knowledge Base!"}]},{"type":"paragraph","content":[{"type":"text","text":"This is our internal knowledge base where we document everything important about working at Inbound.no. Here you''ll find guides, processes, and answers to common questions."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"What you can do here"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Browse categories to find documentation"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Search for specific topics"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Read articles and guides"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Ask questions in the Q&A section"}]}]}]},{"type":"paragraph","content":[{"type":"text","text":"Feel free to explore and reach out if you have any questions!"}]}]}',
    'Welcome to our internal knowledge base',
    'published',
    'c3429178-ed64-41db-8a77-47312c4886fb',
    NOW()
  ),
  (
    '55555555-5555-5555-5555-555555555552',
    'Setting Up Your Development Environment',
    'dev-environment-setup',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Development Environment Setup"}]},{"type":"paragraph","content":[{"type":"text","text":"Follow these steps to get your local development environment ready for working on Inbound projects."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Required Tools"}]},{"type":"orderedList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Node.js 20.x LTS"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"pnpm package manager"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Git for version control"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"VS Code or your preferred editor"}]}]}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Installation Steps"}]},{"type":"paragraph","content":[{"type":"text","text":"1. Clone the repository"}]},{"type":"paragraph","content":[{"type":"text","text":"2. Install dependencies with pnpm install"}]},{"type":"paragraph","content":[{"type":"text","text":"3. Set up your environment variables"}]},{"type":"paragraph","content":[{"type":"text","text":"4. Run the development server"}]}]}',
    'Guide to setting up your development environment',
    'published',
    'c3429178-ed64-41db-8a77-47312c4886fb',
    NOW()
  ),
  (
    '55555555-5555-5555-5555-555555555553',
    'Code Review Best Practices',
    'code-review-best-practices',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Code Review Best Practices"}]},{"type":"paragraph","content":[{"type":"text","text":"Code reviews are an essential part of our development process. They help maintain code quality and share knowledge across the team."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"For Authors"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Keep PRs small and focused"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Write clear descriptions"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Add tests for new features"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Respond to feedback constructively"}]}]}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"For Reviewers"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Review within 24 hours"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Be kind and constructive"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Focus on code quality"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Ask questions to understand"}]}]}]}]}',
    'Best practices for giving and receiving code reviews',
    'published',
    'c3429178-ed64-41db-8a77-47312c4886fb',
    NOW()
  ),
  (
    '55555555-5555-5555-5555-555555555554',
    'Understanding Our Design System',
    'design-system-guide',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Inbound Design System"}]},{"type":"paragraph","content":[{"type":"text","text":"Our design system ensures consistency across all Inbound products. It includes UI components, color palettes, typography, and spacing guidelines."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Core Principles"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Consistency - Use established patterns"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Accessibility - Design for everyone"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Simplicity - Keep interfaces clean"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Scalability - Components should work at any scale"}]}]}]},{"type":"paragraph","content":[{"type":"text","text":"Check our Figma library for detailed component specifications."}]}]}',
    'Introduction to the Inbound design system',
    'published',
    'c3429178-ed64-41db-8a77-47312c4886fb',
    NOW()
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'Company Values and Culture',
    'company-values',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Our Values and Culture"}]},{"type":"paragraph","content":[{"type":"text","text":"At Inbound, we believe in creating an environment where everyone can do their best work. Our values guide how we work together and serve our customers."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Core Values"}]},{"type":"orderedList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"Customer First"},{"type":"text","text":" - We prioritize customer needs in everything we do"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"Transparency"},{"type":"text","text":" - We communicate openly and honestly"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"Continuous Learning"},{"type":"text","text":" - We embrace growth and improvement"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"Collaboration"},{"type":"text","text":" - We achieve more together"}]}]}]}]}',
    'Learn about what drives us at Inbound',
    'published',
    'c3429178-ed64-41db-8a77-47312c4886fb',
    NOW()
  );

-- Link articles to categories
INSERT INTO article_categories (article_id, category_id) VALUES
  ('55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111111'), -- Welcome -> Getting Started
  ('55555555-5555-5555-5555-555555555552', '22222222-2222-2222-2222-222222222223'), -- Dev Setup -> Development Setup
  ('55555555-5555-5555-5555-555555555553', '22222222-2222-2222-2222-222222222224'), -- Code Review -> Code Standards
  ('55555555-5555-5555-5555-555555555554', '33333333-3333-3333-3333-333333333334'), -- Design System -> Design System
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111113'); -- Company Values -> Company Culture

-- Show final counts
SELECT 'Articles created:' as result, COUNT(*) as count FROM articles
UNION ALL
SELECT 'Categories with articles:' as result, COUNT(DISTINCT category_id) as count FROM article_categories;
