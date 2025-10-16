# Quickstart Guide: Internal Knowledge Base

**Feature**: Internal Knowledge Base Platform
**Last Updated**: 2025-10-16
**For**: Developers setting up local development environment

This guide will get you from zero to a running knowledge base in under 15 minutes.

---

## Prerequisites

Before starting, ensure you have:

- **Node.js**: Version 20.x LTS ([download](https://nodejs.org/))
- **pnpm**: Fast package manager ([install](https://pnpm.io/installation))
- **Git**: Version control
- **Supabase Account**: Free tier ([signup](https://supabase.com))
- **Vercel Account**: For deployment ([signup](https://vercel.com))
- **Code Editor**: VS Code recommended

**Check versions**:
```bash
node --version   # Should be v20.x
pnpm --version   # Should be 8.x or higher
git --version    # Any recent version
```

---

## Part 1: Project Setup (5 minutes)

### 1.1 Initialize Next.js Project

```bash
# Navigate to repo root
cd /Users/bendavidson/websites/inbound-tettra

# Initialize Next.js with TypeScript
pnpm create next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*"

# Answer prompts:
# ✔ Would you like to use ESLint? Yes
# ✔ Would you like to use Turbopack? No (optional, up to you)
# ✔ Customize import alias? No (already set to @/*)
```

This creates:
- `app/` directory with Next.js App Router
- `package.json` with dependencies
- `tsconfig.json` TypeScript configuration
- `tailwind.config.ts` for styling
- `next.config.js` for Next.js settings

### 1.2 Install Dependencies

```bash
# Supabase client and auth helpers
pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs

# TipTap rich text editor
pnpm add @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link

# Validation and utilities
pnpm add zod class-variance-authority clsx tailwind-merge

# UI components (optional, for rapid development)
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select

# Development dependencies
pnpm add -D @types/node vitest @vitejs/plugin-react playwright @playwright/test
```

### 1.3 Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Other platforms: https://supabase.com/docs/guides/cli
```

### 1.4 Move Fonts to Public Directory

```bash
# Move TT Hoves Pro fonts to public directory
mkdir -p public/fonts
mv "TT Hoves Pro/woff2/"*.woff2 public/fonts/
```

---

## Part 2: Supabase Setup (5 minutes)

### 2.1 Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Enter details:
   - **Name**: `inbound-knowledge-base`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Europe West (closest to Norway)
   - **Pricing Plan**: Free
4. Wait ~2 minutes for project creation

### 2.2 Link Local Project to Supabase

```bash
# Login to Supabase CLI
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Find YOUR_PROJECT_REF in Supabase dashboard URL:
# https://supabase.com/dashboard/project/YOUR_PROJECT_REF
```

### 2.3 Initialize Database

```bash
# Create migrations directory
mkdir -p supabase/migrations

# Copy initial schema migration
# (You'll create this file - see data-model.md for SQL)
supabase db diff --file initial_schema

# Apply migrations locally
supabase db push

# Apply migrations to remote
supabase db push --linked
```

### 2.4 Get Supabase Keys

1. In Supabase dashboard, go to **Settings** > **API**
2. Copy these values:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (long JWT)

### 2.5 Configure Environment Variables

Create `.env.local` file in project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important**: Never commit `.env.local` to git!

Create `.env.local.example` for reference:
```bash
cp .env.local .env.local.example
# Edit .env.local.example to remove actual values
```

---

## Part 3: Configure TT Hoves Pro Font (2 minutes)

### 3.1 Update Tailwind Config

Edit `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-tt-hoves)", "system-ui", "sans-serif"],
      },
      colors: {
        // Inbound design system colors (extract from Figma)
        primary: {
          50: "#faf8f5",
          100: "#e3f3f4",
          // ... add full palette
        },
        accent: {
          500: "#ff6b9d", // Pink accent
          // ... add variants
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"), // For article content
  ],
};

export default config;
```

### 3.2 Load Font in Root Layout

Edit `app/layout.tsx`:

```typescript
import localFont from "next/font/local";
import "./globals.css";

const ttHoves = localFont({
  src: [
    {
      path: "../public/fonts/TTHovesPro-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/TTHovesPro-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/TTHovesPro-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-tt-hoves",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={ttHoves.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

---

## Part 4: Create Supabase Client (2 minutes)

### 4.1 Create Client Utilities

Create `lib/supabase/client.ts`:

```typescript
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export const createClient = () => {
  return createClientComponentClient();
};
```

Create `lib/supabase/server.ts`:

```typescript
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const createClient = () => {
  return createServerComponentClient({ cookies });
};
```

Create `lib/supabase/middleware.ts`:

```typescript
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check auth for protected routes
  if (req.nextUrl.pathname.startsWith("/app") && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Verify email domain
  if (session && !session.user.email?.endsWith("@inbound.no")) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=invalid_domain", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/app/:path*", "/api/:path*"],
};
```

### 4.2 Configure Middleware

Create `middleware.ts` in project root:

```typescript
export { middleware } from "./lib/supabase/middleware";
export { config } from "./lib/supabase/middleware";
```

---

## Part 5: First Run (1 minute)

### 5.1 Start Development Server

```bash
# Start Next.js dev server
pnpm dev
```

Visit: [http://localhost:3000](http://localhost:3000)

You should see the Next.js welcome page.

### 5.2 Start Supabase Studio (Optional)

```bash
# In a separate terminal
supabase start
```

This starts:
- **Supabase Studio**: http://localhost:54323
- **Local PostgreSQL**: localhost:54322
- **Local API**: http://localhost:54321

---

## Part 6: Verify Setup

### 6.1 Check Database Connection

Create `app/api/health/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("count")
    .limit(1);

  if (error) {
    return NextResponse.json(
      { status: "error", error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ status: "ok", database: "connected" });
}
```

Test: [http://localhost:3000/api/health](http://localhost:3000/api/health)

Should return: `{"status":"ok","database":"connected"}`

### 6.2 Create Test User

```bash
# Using Supabase CLI
supabase auth signup --email test@inbound.no --password testpassword123

# Or via Supabase Studio: http://localhost:54323
# Go to Authentication > Users > Add User
```

**Important**: Email must end with `@inbound.no` due to domain restriction.

---

## Part 7: Next Steps

### Development Workflow

1. **Create database migration**:
   ```bash
   supabase migration new feature_name
   # Edit SQL in supabase/migrations/
   supabase db push
   ```

2. **Run tests**:
   ```bash
   pnpm test        # Unit tests
   pnpm test:e2e    # E2E tests
   ```

3. **Format code**:
   ```bash
   pnpm format      # Prettier
   pnpm lint        # ESLint
   ```

### Implementation Order

Follow this sequence (matches user story priorities):

**Phase 1 - P1 Features** (MVP):
1. Authentication (login, signup, email verification)
2. Article viewing (read-only)
3. Category browsing
4. Search functionality

**Phase 2 - P2 Features** (Essential):
5. Article creation (rich text editor)
6. Article editing
7. Category management
8. Draft/publish workflow

**Phase 3 - P3/P4 Features** (Nice-to-have):
9. Q&A system
10. Tettra import

### Recommended File to Start With

`app/(auth)/login/page.tsx` - Login page (P1, blocking)

---

## Troubleshooting

### "Module not found: @supabase/..."

```bash
# Clear cache and reinstall
rm -rf node_modules .next
pnpm install
```

### "Invalid API key"

- Check `.env.local` has correct Supabase URL and anon key
- Restart dev server after changing env vars

### "Authentication failed"

- Ensure email ends with `@inbound.no`
- Check Supabase Auth Hook is enabled (see data-model.md)

### "Database connection failed"

```bash
# Restart Supabase local services
supabase stop
supabase start
```

### Font not loading

- Verify `.woff2` files are in `public/fonts/`
- Check font paths in `layout.tsx` match filenames
- Clear browser cache and hard refresh

---

## Useful Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server

# Database
supabase db reset     # Reset local database
supabase db push      # Apply migrations
supabase db diff      # Generate migration from changes

# Testing
pnpm test             # Run unit tests
pnpm test:watch       # Watch mode
pnpm test:e2e         # E2E tests
pnpm test:contract    # API contract tests

# Linting
pnpm lint             # Run ESLint
pnpm format           # Run Prettier

# Supabase
supabase start        # Start local Supabase
supabase stop         # Stop local Supabase
supabase status       # Check service status
```

---

## Resources

**Documentation**:
- [Feature Spec](./spec.md) - Full requirements
- [Data Model](./data-model.md) - Database schema
- [API Contracts](./contracts/api-spec.yaml) - API reference
- [Research](./research.md) - Technology decisions

**External Docs**:
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TipTap Editor](https://tiptap.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)

**Design System**:
- [Figma Design](https://www.figma.com/design/rg8BkfzZU04Dvk7ejm6fZC/Inbound-website-2025?node-id=2060-611)

---

## Getting Help

- **Issues**: Create issue in GitHub repo
- **Questions**: Ask in team Slack channel
- **Bugs**: Check existing issues first

---

You're now ready to start implementing the knowledge base! Begin with authentication (P1) and work through the user stories in priority order.
