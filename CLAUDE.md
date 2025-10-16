# inbound-tettra Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-16

## Active Technologies
- TypeScript 5.x with Node.js 20.x LTS + Next.js 14 (App Router), React 18, Supabase Client, TipTap (rich text editor), Tailwind CSS 3.x (001-internal-knowledge-base)

## Project Structure
```
src/
tests/
```

## Commands
npm test && npm run lint

## Code Style
TypeScript 5.x with Node.js 20.x LTS: Follow standard conventions

## Recent Changes
- 001-internal-knowledge-base: Added TypeScript 5.x with Node.js 20.x LTS + Next.js 14 (App Router), React 18, Supabase Client, TipTap (rich text editor), Tailwind CSS 3.x

<!-- MANUAL ADDITIONS START -->

## CRITICAL: Middleware Configuration

**DO NOT modify `lib/supabase/middleware.ts` without understanding this issue:**

The middleware MUST skip static assets (_next/static, .js, .css, .woff2, etc.) BEFORE attempting authentication. If the middleware runs `supabase.auth.getUser()` on static asset requests, it will redirect unauthenticated requests to /login, which returns HTML instead of the expected JavaScript/CSS files.

**Symptoms of broken middleware:**
- Browser console errors: "Unexpected token '<'" in webpack.js, main-app.js, etc.
- CSS not loading (unstyled page)
- JavaScript not executing (forms submit as GET requests with URL parameters)

**Required pattern in middleware.ts:**
```typescript
export async function middleware(req: NextRequest) {
  // Skip middleware for static assets and Next.js internals
  const path = req.nextUrl.pathname;
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.includes('.')
  ) {
    return NextResponse.next();
  }

  // ... rest of authentication logic ...
}
```

The matcher config alone is NOT sufficient - you MUST have explicit path checks at the start of the middleware function.

## CRITICAL: Supabase Foreign Key Relationships

**DO NOT use Supabase foreign key hints for articles ↔ profiles joins:**

Supabase's PostgREST requires a **direct foreign key constraint** in the database schema to use join hints like `profiles!author_id(...)`. Our schema has:
- `articles.author_id` → `auth.users.id` ✅
- `profiles.id` → `auth.users.id` ✅
- `articles.author_id` → `profiles.id` ❌ (NO direct FK)

**INCORRECT (will fail with PGRST200 error):**
```typescript
// ❌ This will NOT work - no direct FK between articles and profiles
const { data } = await supabase
  .from('articles')
  .select('*, profiles!author_id(full_name)')
```

**CORRECT approach - fetch separately and join in code:**
```typescript
// ✅ Step 1: Fetch articles
const { data: articles } = await supabase
  .from('articles')
  .select('id, title, author_id, ...')
  .eq('status', 'published');

// ✅ Step 2: Fetch profiles for all authors
const authorIds = [...new Set(articles.map(a => a.author_id))];
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, full_name')
  .in('id', authorIds);

// ✅ Step 3: Join in JavaScript
const authorMap = new Map(profiles.map(p => [p.id, p.full_name]));
const result = articles.map(article => ({
  ...article,
  author_name: authorMap.get(article.author_id) || 'Unknown'
}));
```

**Why this pattern:**
- More efficient for multiple articles (fetches profiles once, not per article)
- Works with our indirect relationship through auth.users
- No database schema changes required

**Affected files using this pattern:**
- `app/(protected)/categories/[id]/page.tsx` - getCategoryArticles()
- `app/(protected)/page.tsx` - getRecentArticles()
- `app/(protected)/articles/[id]/page.tsx` - article detail
- `app/api/articles/route.ts` - articles list API
- `app/api/articles/[id]/route.ts` - article detail API

## CRITICAL: Supabase Auth URL Configuration

**The app URL in `.env.local` MUST match `supabase/config.toml` auth settings:**

```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000

# supabase/config.toml [auth] section
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000", "http://127.0.0.1:3000"]
```

**Why this matters:**
- Mismatched URLs cause authentication failures
- RLS policies rely on proper auth context
- Silent failures: sidebar shows article counts but no articles display

**After changing ports:**
1. Update both `.env.local` and `supabase/config.toml`
2. Restart Supabase: `supabase stop && supabase start`
3. Clear browser cookies or use incognito
4. Log in again

<!-- MANUAL ADDITIONS END -->
