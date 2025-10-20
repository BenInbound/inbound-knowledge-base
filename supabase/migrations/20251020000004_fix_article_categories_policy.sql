-- Fix article_categories RLS policy to support inserts
-- The policy was missing WITH CHECK clause, preventing category assignments

DROP POLICY IF EXISTS "Authors can manage own article categories" ON article_categories;

CREATE POLICY "Authors can manage own article categories"
  ON article_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_categories.article_id
      AND articles.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_categories.article_id
      AND articles.author_id = auth.uid()
    )
  );

-- Also add a policy for admins to manage any article's categories
CREATE POLICY "Admins can manage all article categories"
  ON article_categories FOR ALL
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
