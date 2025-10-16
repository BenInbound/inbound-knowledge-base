# Phase 0: Research & Technology Decisions

**Feature**: Internal Knowledge Base Platform
**Date**: 2025-10-16
**Status**: Completed

## Overview

This document captures research findings and technology decisions for the internal knowledge base platform. All NEEDS CLARIFICATION items from the Technical Context have been resolved.

---

## Frontend Framework

**Decision**: Next.js 14 with App Router

**Rationale**:
- User specified Vercel for hosting (Next.js is Vercel's framework)
- App Router provides React Server Components for better performance
- Built-in API routes eliminate need for separate backend
- Excellent TypeScript support
- File-based routing matches documentation structure naturally
- Built-in image optimization for article images
- Edge runtime support for fast global access

**Alternatives Considered**:
- **Remix**: Good SSR but less mature ecosystem, Vercel deployment requires adapter
- **SvelteKit**: Excellent performance but smaller ecosystem, team may have less React experience
- **Create React App**: Client-only rendering inappropriate for content-heavy documentation site
- **Gatsby**: Static site generation doesn't fit dynamic content creation requirements

**Best Practices**:
- Use React Server Components for data fetching pages (articles, categories)
- Use Client Components only when needed (editor, search input, interactive UI)
- Implement route groups for auth boundaries: `(auth)` and `(protected)`
- Use Next.js middleware for authentication checks
- Leverage Vercel Edge Functions for search API (fast global response)

---

## Database & Backend

**Decision**: Supabase (PostgreSQL with built-in authentication)

**Rationale**:
- User explicitly specified Supabase
- PostgreSQL provides full-text search with `tsvector` and `tsquery`
- Row Level Security (RLS) enforces @inbound.no email restriction at database level
- Built-in authentication with email verification
- Supabase Storage for image uploads (integrated with same account)
- Real-time subscriptions (potential future feature for collaborative editing)
- Generous free tier for internal team size (~50 users)

**Alternatives Considered**:
- **Sanity CMS**: User mentioned as option but adds complexity; Supabase provides enough structure
- **PlanetScale**: Great database but no built-in auth, would need separate auth service
- **Firebase**: Good auth but Firestore document model less suited to relational article/category structure
- **Self-hosted PostgreSQL**: More operational overhead, Supabase provides managed solution

**Best Practices**:
- Use Row Level Security policies to enforce @inbound.no domain at database level
- Create database indexes on article content for full-text search performance
- Use Supabase client-side SDK for auth, server-side for data mutations
- Store article content as JSONB for flexible rich text structure
- Use foreign keys for article-category relationships
- Enable point-in-time recovery for data protection

---

## Rich Text Editor

**Decision**: TipTap (ProseMirror-based React editor)

**Rationale**:
- Modern, headless editor with full React integration
- Based on ProseMirror (battle-tested editor framework)
- Supports all required formatting: headings, bold, italic, lists, links, images
- Extensible for future needs (tables, code blocks, embeds)
- Outputs structured JSON format (stores well in Supabase JSONB)
- Active development and good documentation
- MIT license

**Alternatives Considered**:
- **Slate.js**: More low-level, requires more custom development
- **Draft.js**: Older, Facebook no longer actively maintaining
- **Quill**: Simpler but less flexible, harder to customize for design system
- **Lexical**: Meta's new editor, very promising but still early (beta)
- **ContentEditable + Markdown**: Too basic, poor UX for non-technical users

**Best Practices**:
- Store content as TipTap JSON format in database
- Create custom TipTap extensions matching Inbound design system
- Implement image upload handler with Supabase Storage integration
- Debounce auto-save to drafts every 30 seconds
- Render read-only view using TipTap's `editable: false` mode for consistency
- Use Zod schemas to validate editor output before saving

---

## Styling & Design System

**Decision**: Tailwind CSS 3.x with custom design tokens from Figma

**Rationale**:
- Rapid prototyping with utility classes
- Easy to implement Inbound design system (beige/cream palette, pink/red accents)
- Excellent TypeScript support with type-safe config
- PurgeCSS removes unused styles (small production bundle)
- Works well with Next.js and React components
- Community plugins for forms, typography

**Alternatives Considered**:
- **CSS Modules**: More verbose, harder to maintain consistency
- **Styled Components**: Runtime CSS-in-JS has performance overhead
- **Vanilla CSS**: No design token system, harder to maintain

**Implementation Plan**:
- Extract design tokens from Figma (colors, spacing, typography)
- Configure TT Hoves Pro fonts in `tailwind.config.ts`
- Create custom Tailwind classes for Inbound brand colors
- Use `@next/font` for optimized font loading
- Build component library with consistent styling (buttons, inputs, cards)

**Best Practices**:
- Define design tokens in `tailwind.config.ts` theme extension
- Use semantic color names (primary, accent, surface) not literal (beige, pink)
- Create reusable component variants using class-variance-authority
- Use Tailwind prose plugin for article content typography
- Host TT Hoves Pro fonts locally (already in repo) for GDPR compliance

---

## Authentication & Authorization

**Decision**: Supabase Auth with email domain verification

**Rationale**:
- Integrated with Supabase database
- Built-in email verification flow
- Can enforce @inbound.no domain in signup hook
- Session management with JWT tokens
- Secure by default (httpOnly cookies with Next.js middleware)
- Magic link option for passwordless auth

**Implementation Details**:
- Create Supabase Auth Hook (PostgreSQL function) to block non-@inbound.no signups
- Use Next.js middleware to check auth on all `/app/(protected)/*` routes
- Implement Row Level Security policies checking `auth.email()` domain
- Store minimal user data (Supabase handles auth tables)

**Alternatives Considered**:
- **NextAuth.js**: Flexible but requires more setup, Supabase Auth simpler for single provider
- **Auth0**: Enterprise features not needed, costs more at scale
- **Clerk**: Good UX but adds external dependency, Supabase Auth sufficient
- **Custom JWT**: Reinventing wheel, security risk

**Best Practices**:
- Validate email domain server-side (never trust client)
- Use Supabase RLS to double-enforce email domain at database level
- Implement session refresh before expiry
- Provide clear error messages for non-@inbound.no emails
- Log authentication attempts for security monitoring

---

## Search Implementation

**Decision**: PostgreSQL Full-Text Search with `pg_tsvector`

**Rationale**:
- Already included in Supabase PostgreSQL
- No additional service required (cost-effective)
- Supports ranking by relevance (`ts_rank`)
- Can search across article title, content, categories
- Handles Norwegian and English text
- Sufficient for ~1000 articles

**Implementation**:
- Create generated column `search_vector` as `tsvector` on articles table
- Create GIN index on `search_vector` for fast lookups
- Use `ts_headline` to generate text snippets with match highlights
- Rank results by `ts_rank` and recency

**Alternatives Considered**:
- **Algolia**: Excellent search but external dependency, costs scale with operations
- **Elasticsearch**: Overkill for 1000 articles, operational overhead
- **Typesense**: Good open-source alternative but requires separate hosting
- **Client-side search (Fuse.js)**: Won't scale, security risk exposing all content

**Best Practices**:
- Use Norwegian + English text search configurations
- Index article title with higher weight than content
- Include category names in search index
- Debounce search input (300ms) to reduce queries
- Cache frequent searches with Vercel Edge caching
- Return max 50 results with pagination

---

## Testing Strategy

**Decision**: Vitest (unit) + Playwright (E2E) + React Testing Library

**Rationale**:
- Vitest: Fast, Vite-native, great TypeScript support, Jest-compatible API
- Playwright: Cross-browser E2E testing, great for auth flows
- React Testing Library: Component testing following best practices

**Test Coverage Goals**:
- Unit tests: Utility functions, validation schemas, business logic
- Integration tests: API routes with test database
- E2E tests: Critical paths (auth, create article, search)

**Alternatives Considered**:
- **Jest**: Slower than Vitest, requires more config
- **Cypress**: Good E2E but Playwright has better cross-browser support
- **Testing Library alone**: Need E2E for auth flows

**Best Practices**:
- Test user scenarios from spec (acceptance criteria)
- Use Supabase local development for test database
- Mock external services (email) in E2E tests
- Run E2E tests on PR builds via Vercel deployment previews
- Aim for 80% coverage on business logic

---

## Tettra Import Strategy

**Decision**: CSV/JSON parser with validation and manual import endpoint

**Rationale**:
- Tettra exports typically CSV or JSON format
- One-time operation, doesn't need complex UI
- Can be admin-only API route
- Validate and sanitize before import

**Implementation**:
- Create `/api/import/tettra` endpoint
- Accept file upload (CSV or JSON)
- Parse and validate against schema
- Insert in transaction (all-or-nothing)
- Return detailed report (success count, errors)

**Alternatives Considered**:
- **Background job**: Overkill for one-time import
- **Manual database insert**: Error-prone, no validation
- **Separate import tool**: Adds complexity

**Best Practices**:
- Dry-run mode first (validate without inserting)
- Provide detailed error messages with line numbers
- Preserve Tettra IDs in metadata for reference
- Handle duplicate detection
- Limit file size to prevent DoS

---

## Development Workflow

**Decision**: Local Supabase + Vercel CLI for dev environment

**Tools**:
- Supabase CLI for local PostgreSQL with migrations
- Vercel CLI for local Next.js development with edge functions
- pnpm for faster package management
- TypeScript strict mode
- ESLint + Prettier for code consistency

**Best Practices**:
- Use Supabase migrations for schema changes (version controlled)
- Environment variables in `.env.local` (never commit)
- Git branch per feature (already using `001-internal-knowledge-base`)
- Use Vercel preview deployments for PR reviews
- Seed script for development data

---

## Summary of Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Frontend** | Next.js | 14.x |
| **Language** | TypeScript | 5.x |
| **Runtime** | Node.js | 20.x LTS |
| **UI Library** | React | 18.x |
| **Styling** | Tailwind CSS | 3.x |
| **Editor** | TipTap | 2.x |
| **Database** | Supabase (PostgreSQL) | 15.x |
| **Auth** | Supabase Auth | - |
| **Storage** | Supabase Storage | - |
| **Search** | PostgreSQL FTS | - |
| **Testing** | Vitest + Playwright | Latest |
| **Deployment** | Vercel | - |
| **Fonts** | TT Hoves Pro | Provided |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Email domain bypass | Low | High | Server + DB-level validation, RLS policies |
| Search performance at scale | Medium | Medium | PostgreSQL FTS sufficient for 1000 articles, can migrate to Algolia later |
| Rich text XSS attacks | Medium | High | Sanitize editor output, use TipTap's built-in security |
| Concurrent editing conflicts | Medium | Low | Implement last-write-wins, future: add conflict detection |
| Image storage costs | Low | Low | 5MB limit, compress images, Supabase free tier sufficient |
| Tettra import failures | Medium | Low | Dry-run mode, manual fallback, detailed error reporting |

---

## Open Questions (to be resolved in Phase 1)

- [ ] Exact Figma design token values (colors, spacing) - need to extract from Figma file
- [ ] User permission levels: Should all users be equal, or roles (admin, editor, viewer)?
- [ ] Article version history: Simple timestamp or full revision diff?
- [ ] Category depth limit: How many levels of nesting?
- [ ] Notification system: Email notifications for Q&A answers?

**Next Phase**: Proceed to Phase 1 (Design & Contracts) to create data-model.md and API contracts.
