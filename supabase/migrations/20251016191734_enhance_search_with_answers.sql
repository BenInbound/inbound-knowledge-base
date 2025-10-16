-- Enhance search to include answers in question search context
-- T140: Include answers in question search context

-- Drop the existing search function
DROP FUNCTION IF EXISTS search_content(TEXT);

-- Recreate the search function with answer support
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
  -- Search articles
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

  -- Search questions (title and body)
  SELECT
    'question'::TEXT as type,
    q.id,
    q.title,
    LEFT(q.body, 200) as excerpt,
    ts_rank(q.search_vector, websearch_to_tsquery('english', search_query)) as rank,
    q.created_at
  FROM questions q
  WHERE q.search_vector @@ websearch_to_tsquery('english', search_query)

  UNION ALL

  -- Search answers and return the parent question
  -- This allows users to find questions by searching answer content
  SELECT DISTINCT ON (q.id)
    'question'::TEXT as type,
    q.id,
    q.title,
    LEFT(ans.content, 200) as excerpt,
    ts_rank(to_tsvector('english', ans.content), websearch_to_tsquery('english', search_query)) as rank,
    q.created_at
  FROM answers ans
  JOIN questions q ON ans.question_id = q.id
  WHERE to_tsvector('english', ans.content) @@ websearch_to_tsquery('english', search_query)

  ORDER BY rank DESC, created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comment to the function
COMMENT ON FUNCTION search_content IS 'Full-text search across articles, questions, and answers. When answers match, returns the parent question.';
