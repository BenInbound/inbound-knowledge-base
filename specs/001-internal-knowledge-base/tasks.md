# Tasks: Internal Knowledge Base Platform

**Input**: Design documents from `/specs/001-internal-knowledge-base/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize Next.js 14 project with TypeScript, Tailwind CSS, and App Router
- [X] T002 [P] Install core dependencies (Supabase client, auth helpers) in package.json
- [X] T003 [P] Install TipTap editor dependencies (@tiptap/react, starter-kit, extensions) in package.json
- [X] T004 [P] Install validation and utility dependencies (zod, clsx, tailwind-merge) in package.json
- [X] T005 [P] Install testing dependencies (Vitest, Playwright, React Testing Library) in package.json
- [X] T006 [P] Move TT Hoves Pro fonts to public/fonts/ directory
- [X] T007 [P] Configure Tailwind with Inbound design system colors and TT Hoves Pro fonts in tailwind.config.ts
- [X] T008 [P] Setup TypeScript strict mode configuration in tsconfig.json
- [X] T009 [P] Configure ESLint and Prettier for code consistency
- [X] T010 [P] Create project directory structure (app, components, lib, tests)
- [X] T011 [P] Create .env.local.example template file
- [X] T012 [P] Setup Supabase CLI and create local development environment

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema & Migrations

- [X] T013 Create initial Supabase migration file in supabase/migrations/
- [X] T014 [P] Define profiles table schema with RLS policies in migration
- [X] T015 [P] Define categories table schema with hierarchy support and RLS policies in migration
- [X] T016 [P] Define articles table schema with full-text search and RLS policies in migration
- [X] T017 [P] Define article_categories junction table schema with RLS policies in migration
- [X] T018 [P] Define questions table schema with full-text search and RLS policies in migration
- [X] T019 [P] Define answers table schema with RLS policies in migration
- [X] T020 [P] Define import_jobs table schema with RLS policies in migration
- [X] T021 Create auth.check_email_domain() trigger function to enforce @inbound.no restriction in migration
- [X] T022 Create search_content() PostgreSQL function for full-text search in migration
- [X] T023 Create database indexes for performance (foreign keys, search vectors) in migration
- [X] T024 Apply migrations to local Supabase instance using supabase db push
- [X] T025 Create seed data script in supabase/seed.sql with test users, categories, and articles

### Authentication & Authorization

- [X] T026 Create Supabase browser client utility in lib/supabase/client.ts
- [X] T027 Create Supabase server client utility in lib/supabase/server.ts
- [X] T028 Create authentication middleware in lib/supabase/middleware.ts with email domain verification
- [X] T029 Configure Next.js middleware in middleware.ts to protect routes
- [X] T030 Create TypeScript types for User and Profile in lib/types/auth.ts

### Base UI Components

- [X] T031 Configure TT Hoves Pro font loading in app/layout.tsx
- [X] T032 Create global styles with Inbound design system in app/globals.css
- [X] T033 [P] Create Button component with variants in components/ui/button.tsx
- [X] T034 [P] Create Input component in components/ui/input.tsx
- [X] T035 [P] Create Card component in components/ui/card.tsx
- [X] T036 [P] Create Dialog component wrapper in components/ui/dialog.tsx
- [X] T037 [P] Create Loading spinner component in components/ui/loading.tsx
- [X] T038 [P] Create ErrorMessage component in components/ui/error.tsx

### Shared Utilities

- [X] T039 [P] Create TypeScript types for all database entities in lib/types/database.ts
- [X] T040 [P] Create Zod validation schemas for forms in lib/validation/schemas.ts
- [X] T041 [P] Create utility functions (slug generation, date formatting) in lib/utils/helpers.ts
- [X] T042 [P] Create error handling utilities in lib/utils/errors.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 2 - Restricted Access by Email Domain (Priority: P1) 🎯 MVP BLOCKER

**Goal**: Ensure only @inbound.no email addresses can authenticate and access the platform

**Independent Test**: Attempt signup with @inbound.no email (should succeed) and non-@inbound.no email (should be rejected with clear error message)

**Why First**: This is a security requirement that blocks everything. Authentication must work before users can view content.

### Implementation for User Story 2

- [X] T043 [US2] Create login page UI in app/(auth)/login/page.tsx
- [X] T044 [US2] Create signup page UI in app/(auth)/signup/page.tsx
- [X] T045 [US2] Create auth layout with branding in app/(auth)/layout.tsx
- [X] T046 [P] [US2] Implement login form with email/password in components/auth/login-form.tsx
- [X] T047 [P] [US2] Implement signup form with email validation in components/auth/signup-form.tsx
- [X] T048 [US2] Add client-side email domain validation (@inbound.no) to signup form
- [X] T049 [US2] Create auth callback handler in app/auth/callback/route.ts
- [X] T050 [US2] Add error handling for invalid domain attempts with user-friendly messages
- [X] T051 [US2] Create auth helper functions (login, signup, logout) in lib/auth/actions.ts
- [X] T052 [US2] Test authentication flow end-to-end (signup, email verification, login, logout)

**Checkpoint**: Authentication working - users with @inbound.no can now access protected routes

---

## Phase 4: User Story 1 - View and Search Knowledge Base (Priority: P1) 🎯 MVP

**Goal**: Enable team members to browse categories, search for content, and view articles

**Independent Test**: Log in with @inbound.no email, browse at least 3 categories, search for topics, and view article content

**Dependencies**: Requires US2 (authentication) to be complete

### Navigation & Layout

- [X] T053 [US1] Create protected route layout with navigation in app/(protected)/layout.tsx
- [X] T054 [P] [US1] Create main navigation component in components/navigation/main-nav.tsx
- [X] T055 [P] [US1] Create sidebar with category tree in components/navigation/sidebar.tsx
- [X] T056 [P] [US1] Create breadcrumb navigation component in components/navigation/breadcrumbs.tsx

### Home & Category Browsing

- [X] T057 [US1] Create home/dashboard page in app/(protected)/page.tsx
- [X] T058 [US1] Create category list view component in components/categories/category-list.tsx
- [X] T059 [US1] Create category card component in components/categories/category-card.tsx
- [X] T060 [US1] Create category detail page in app/(protected)/categories/[id]/page.tsx
- [X] T061 [US1] Fetch and display articles for a category with Server Components

### Article Viewing

- [X] T062 [US1] Create article view page in app/(protected)/articles/[id]/page.tsx
- [X] T063 [US1] Create article view component with rich text rendering in components/articles/article-view.tsx
- [X] T064 [US1] Implement TipTap read-only renderer for article content in components/editor/article-renderer.tsx
- [X] T065 [US1] Create article metadata component (author, dates, categories) in components/articles/article-metadata.tsx
- [X] T066 [US1] Add view counter increment logic to article page

### Search Implementation

- [X] T067 [US1] Create search API endpoint in app/api/search/route.ts
- [X] T068 [US1] Implement full-text search using PostgreSQL search_content() function in API
- [X] T069 [US1] Create search page in app/(protected)/search/page.tsx
- [X] T070 [P] [US1] Create search input component with debounce in components/search/search-input.tsx
- [X] T071 [P] [US1] Create search results list component in components/search/search-results.tsx
- [X] T072 [P] [US1] Create search result card with highlighted snippets in components/search/result-card.tsx
- [X] T073 [US1] Add search functionality to main navigation header

### API Routes for Viewing

- [X] T074 [P] [US1] Create GET /api/articles endpoint for listing articles in app/api/articles/route.ts
- [X] T075 [P] [US1] Create GET /api/articles/[id] endpoint in app/api/articles/[id]/route.ts
- [X] T076 [P] [US1] Create GET /api/categories endpoint for listing categories in app/api/categories/route.ts
- [X] T077 [P] [US1] Create GET /api/categories/[id] endpoint in app/api/categories/[id]/route.ts

**Checkpoint**: Users can browse, search, and view all published content - MVP is functional!

---

## Phase 5: User Story 3 - Create and Edit Documentation (Priority: P2)

**Goal**: Enable team members to create new articles and edit existing content with rich text formatting

**Independent Test**: Log in, create new article with formatting and images, save as draft, publish, then edit existing article

**Dependencies**: Requires US1 (viewing) and US2 (authentication) to be complete

### Rich Text Editor Setup

- [X] T078 [P] [US3] Create TipTap editor component in components/editor/tiptap-editor.tsx
- [X] T079 [P] [US3] Configure TipTap extensions (StarterKit, Image, Link) in components/editor/extensions.ts
- [X] T080 [P] [US3] Create editor toolbar component in components/editor/editor-toolbar.tsx
- [X] T081 [P] [US3] Create image upload handler with Supabase Storage in lib/storage/image-upload.ts
- [X] T082 [US3] Integrate image upload into TipTap editor

### Article Creation

- [X] T083 [US3] Create article creation page in app/(protected)/articles/new/page.tsx
- [X] T084 [US3] Create article form component in components/articles/article-form.tsx
- [X] T085 [US3] Add title input, category selector, and editor to article form
- [X] T086 [US3] Implement auto-save to drafts (debounced every 30 seconds)
- [X] T087 [US3] Add validation for article content (title length, required fields)
- [X] T088 [US3] Create POST /api/articles endpoint in app/api/articles/route.ts
- [X] T089 [US3] Add draft/publish status toggle to article form
- [X] T090 [US3] Implement slug generation from article title

### Article Editing

- [X] T091 [US3] Create article edit page in app/(protected)/articles/[id]/edit/page.tsx
- [X] T092 [US3] Load existing article data into editor form
- [X] T093 [US3] Create PATCH /api/articles/[id] endpoint in app/api/articles/[id]/route.ts
- [X] T094 [US3] Add permission checks (only author can edit)
- [X] T095 [US3] Update article metadata (updated_at, published_at) on save
- [X] T096 [US3] Add "Edit" button to article view page (visible to author only)

### Image Management

- [X] T097 [US3] Configure Supabase Storage bucket for article images
- [X] T098 [US3] Implement image upload with 5MB size limit and validation
- [X] T099 [US3] Add image compression before upload to optimize storage
- [X] T100 [US3] Handle image deletion when article is deleted

**Checkpoint**: Users can create, edit, and publish articles with full rich text capabilities

---

## Phase 6: User Story 4 - Category and Content Organization (Priority: P2)

**Goal**: Enable organization of content into hierarchical categories with easy management

**Independent Test**: Create categories, add subcategories, move articles between categories, verify navigation reflects hierarchy

**Dependencies**: Requires US1 (viewing), US2 (authentication), and US3 (editing) to be complete

### Category Management UI

- [X] T101 [US4] Create category management page (admin only) in app/(protected)/admin/categories/page.tsx
- [X] T102 [P] [US4] Create category form component in components/categories/category-form.tsx
- [X] T103 [P] [US4] Create category tree view component in components/categories/category-tree.tsx
- [X] T104 [US4] Add parent category selector with max 3 levels depth validation
- [ ] T105 [US4] Implement drag-and-drop reordering for categories
- [X] T106 [US4] Add category creation modal dialog

### Category API Routes

- [X] T107 [US4] Create POST /api/categories endpoint in app/api/categories/route.ts
- [X] T108 [US4] Create PATCH /api/categories/[id] endpoint in app/api/categories/[id]/route.ts
- [X] T109 [US4] Create DELETE /api/categories/[id] endpoint with article check in app/api/categories/[id]/route.ts
- [X] T110 [US4] Add admin role check to all category mutation endpoints

### Article-Category Management

- [X] T111 [US4] Add category assignment to article form (multiple selection)
- [X] T112 [US4] Create article-category relationship management in article editor
- [X] T113 [US4] Update article_categories table when article categories change
- [X] T114 [US4] Add category filter to article list pages
- [X] T115 [US4] Display category breadcrumbs on article pages

### Category Deletion Protection

- [X] T116 [US4] Implement confirmation dialog for category deletion
- [X] T117 [US4] Check for articles in category before allowing deletion
- [X] T118 [US4] Provide option to move articles to different category before deletion

**Checkpoint**: Content organization is fully functional with hierarchical categories

---

## Phase 7: User Story 5 - Q&A System for Unanswered Questions (Priority: P3)

**Goal**: Allow team members to ask questions and receive answers from subject matter experts

**Independent Test**: Submit a question, answer it as another user, search for Q&A pairs, verify questions are marked as answered

**Dependencies**: Requires US1 (viewing), US2 (authentication) to be complete

### Q&A Pages

- [X] T119 [US5] Create Q&A section landing page in app/(protected)/qa/page.tsx
- [X] T120 [US5] Create question detail page in app/(protected)/qa/questions/[id]/page.tsx
- [X] T121 [US5] Create question creation page in app/(protected)/qa/questions/new/page.tsx

### Question Components

- [X] T122 [P] [US5] Create question list component with filters in components/qa/question-list.tsx
- [X] T123 [P] [US5] Create question card component in components/qa/question-card.tsx
- [X] T124 [P] [US5] Create question form component in components/qa/question-form.tsx
- [X] T125 [US5] Add answered/unanswered filter toggle to question list

### Answer Components

- [X] T126 [P] [US5] Create answer list component in components/qa/answer-list.tsx
- [X] T127 [P] [US5] Create answer form component in components/qa/answer-form.tsx
- [X] T128 [US5] Add "Accept Answer" button for question authors
- [X] T129 [US5] Show accepted answer at top of answer list

### Q&A API Routes

- [X] T130 [US5] Create POST /api/qa/questions endpoint in app/api/qa/questions/route.ts
- [X] T131 [US5] Create GET /api/qa/questions endpoint with filters in app/api/qa/questions/route.ts
- [X] T132 [US5] Create GET /api/qa/questions/[id] endpoint in app/api/qa/questions/[id]/route.ts
- [X] T133 [US5] Create PATCH /api/qa/questions/[id] endpoint in app/api/qa/questions/[id]/route.ts
- [X] T134 [US5] Create DELETE /api/qa/questions/[id] endpoint in app/api/qa/questions/[id]/route.ts
- [X] T135 [US5] Create POST /api/qa/questions/[id]/answers endpoint in app/api/qa/questions/[id]/answers/route.ts
- [X] T136 [US5] Create PATCH /api/qa/answers/[id] endpoint in app/api/qa/answers/[id]/route.ts
- [X] T137 [US5] Create DELETE /api/qa/answers/[id] endpoint in app/api/qa/answers/[id]/route.ts
- [X] T138 [US5] Create POST /api/qa/answers/[id]/accept endpoint in app/api/qa/answers/[id]/accept/route.ts

### Search Integration

- [X] T139 [US5] Add questions to main search results
- [X] T140 [US5] Include answers in question search context

**Checkpoint**: Q&A system is fully functional and searchable

---

## Phase 8: User Story 6 - Import Existing Tettra Data (Priority: P4)

**Goal**: Import exported Tettra data (articles, categories) into the new knowledge base

**Independent Test**: Upload Tettra export file, verify articles and categories are created correctly, check error reporting for invalid data

**Dependencies**: Requires US3 (article creation), US4 (category management) to be complete

### Import UI

- [X] T141 [US6] Create import page (admin only) in app/(protected)/admin/import/page.tsx
- [X] T142 [P] [US6] Create file upload component in components/import/file-upload.tsx
- [X] T143 [P] [US6] Create import progress component in components/import/import-progress.tsx
- [X] T144 [P] [US6] Create import results display component in components/import/import-results.tsx
- [X] T145 [US6] Add dry-run mode toggle to import form

### Import Processing

- [X] T146 [US6] Create POST /api/import/tettra endpoint in app/api/import/tettra/route.ts
- [X] T147 [US6] Implement CSV parser for Tettra export format in lib/import/csv-parser.ts
- [X] T148 [US6] Implement JSON parser for Tettra export format in lib/import/json-parser.ts
- [X] T149 [US6] Create validation for imported data against schemas in lib/import/validation.ts
- [X] T150 [US6] Implement dry-run validation (check without inserting)
- [X] T151 [US6] Create article import logic with category mapping in lib/import/article-importer.ts
- [X] T152 [US6] Create category import logic with hierarchy preservation in lib/import/category-importer.ts
- [X] T153 [US6] Handle duplicate detection (by title or slug)
- [X] T154 [US6] Store original Tettra IDs in article import_metadata field

### Import Job Tracking

- [X] T155 [US6] Create import job record in import_jobs table when starting
- [X] T156 [US6] Update job status (pending → processing → completed/failed)
- [X] T157 [US6] Track import statistics (total, success, failed counts)
- [X] T158 [US6] Log detailed errors for failed imports in job errors field
- [X] T159 [US6] Create GET /api/import/jobs/[id] endpoint in app/api/import/jobs/[id]/route.ts
- [X] T160 [US6] Display import history on import page

**Checkpoint**: Tettra data can be successfully imported with full error reporting

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final touches

### Error Handling & Validation

- [X] T161 [P] Add comprehensive error boundaries to all main pages
- [X] T162 [P] Implement global error handling for API routes
- [X] T163 [P] Add input validation error messages to all forms
- [X] T164 [P] Create 404 page in app/not-found.tsx
- [X] T165 [P] Create error page in app/error.tsx

### Performance Optimization

- [X] T166 [P] Add loading skeletons to all data-fetching pages
- [X] T167 [P] Implement pagination for article lists (20 per page)
- [X] T168 [P] Add React.lazy for code splitting on heavy components
- [X] T169 [P] Optimize images with Next.js Image component
- [X] T170 [P] Add search query debouncing (300ms)
- [X] T171 [P] Enable Vercel Edge caching for search results

### Security Hardening

- [X] T172 [P] Sanitize TipTap editor output to prevent XSS
- [X] T173 [P] Add rate limiting to API routes
- [X] T174 [P] Implement CSRF protection for forms
- [X] T175 [P] Add security headers in next.config.js
- [X] T176 [P] Review and test all RLS policies

### User Experience

- [X] T177 [P] Add toast notifications for success/error actions
- [X] T178 [P] Implement keyboard shortcuts (Cmd+K for search)
- [X] T179 [P] Add responsive design testing for mobile devices
- [X] T180 [P] Create empty states for lists with no content
- [X] T181 [P] Add confirmation dialogs for destructive actions

### Documentation

- [ ] T182 [P] Update README.md with setup instructions
- [ ] T183 [P] Document environment variables in .env.local.example
- [ ] T184 [P] Create API documentation with Swagger UI
- [ ] T185 [P] Add inline code comments for complex logic

### Testing & Deployment

- [ ] T186 Run through quickstart.md to validate setup process
- [ ] T187 Perform end-to-end testing of all user stories
- [ ] T188 Test authentication flow with multiple users
- [ ] T189 Test search functionality with various queries
- [ ] T190 Verify category hierarchy display and navigation
- [ ] T191 [P] Create Vercel project and link repository
- [ ] T192 [P] Configure environment variables in Vercel
- [ ] T193 [P] Setup Supabase production project and apply migrations
- [ ] T194 Deploy to Vercel preview environment
- [ ] T195 Smoke test production deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 2 (Phase 3)**: Depends on Foundational completion - BLOCKS all other stories (authentication required)
- **User Story 1 (Phase 4)**: Depends on US2 completion (need auth to view content)
- **User Story 3 (Phase 5)**: Depends on US1 + US2 completion (need to view and be authenticated to create)
- **User Story 4 (Phase 6)**: Depends on US1 + US2 + US3 completion (need content creation before organization)
- **User Story 5 (Phase 7)**: Depends on US1 + US2 completion (independent feature, only needs viewing and auth)
- **User Story 6 (Phase 8)**: Depends on US3 + US4 completion (needs creation and organization logic)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### Critical Path (MVP)

The absolute minimum path to a functional MVP:

1. **Phase 1** (Setup) → **Phase 2** (Foundational) → **Phase 3** (US2 - Authentication) → **Phase 4** (US1 - View/Search)

This gives you a working knowledge base where authenticated users can browse and search content.

### User Story Dependencies

```
US2 (Auth)
    ├── US1 (View/Search) [Can deliver MVP here!]
    │   ├── US3 (Create/Edit)
    │   │   └── US4 (Categories)
    │   │       └── US6 (Import)
    │   └── US5 (Q&A) [Independent branch]
```

- **US2 (P1)**: BLOCKS everything - must complete first
- **US1 (P1)**: Depends on US2 - delivers MVP viewing capability
- **US3 (P2)**: Depends on US1 + US2 - enables content creation
- **US4 (P2)**: Depends on US1 + US2 + US3 - organizes content
- **US5 (P3)**: Depends on US1 + US2 - independent Q&A feature
- **US6 (P4)**: Depends on US3 + US4 - migration feature

### Parallel Opportunities

**Within Setup (Phase 1)**: Tasks T002-T012 can all run in parallel (different config files)

**Within Foundational (Phase 2)**:
- Database tables (T014-T020) can be defined in parallel
- UI components (T033-T038) can be built in parallel
- Utilities (T039-T042) can be created in parallel

**After Foundational Phase**:
- **If working solo**: Complete US2 → US1 → US3 → US4 → US5 → US6 (sequential by priority)
- **If team of 2**: After US2 completes, Developer A tackles US1 while Developer B works on US3
- **If team of 3+**: After US2 completes, split work on US1, US3, and US5 simultaneously

**Within Each User Story**: Tasks marked [P] can run in parallel (different files, no dependencies)

---

## Parallel Execution Examples

### Parallel: Foundational Phase Database Tables

All database table definitions can be created simultaneously:

```bash
# Launch together:
- T014: profiles table
- T015: categories table
- T016: articles table
- T017: article_categories junction table
- T018: questions table
- T019: answers table
- T020: import_jobs table
```

### Parallel: Foundational Phase UI Components

All base UI components can be built simultaneously:

```bash
# Launch together:
- T033: Button component
- T034: Input component
- T035: Card component
- T036: Dialog component
- T037: Loading component
- T038: ErrorMessage component
```

### Parallel: User Story 1 API Routes

All viewing API endpoints can be implemented simultaneously:

```bash
# Launch together:
- T074: GET /api/articles (list)
- T075: GET /api/articles/[id] (detail)
- T076: GET /api/categories (list)
- T077: GET /api/categories/[id] (detail)
```

### Parallel: User Story 1 Search Components

Search UI components can be built simultaneously:

```bash
# Launch together:
- T070: Search input component
- T071: Search results list component
- T072: Search result card component
```

---

## Implementation Strategy

### Strategy 1: MVP First (Recommended for Solo Developer)

**Goal**: Get to a working product ASAP

1. ✅ **Phase 1**: Setup (essential infrastructure)
2. ✅ **Phase 2**: Foundational (BLOCKS everything - critical to complete)
3. ✅ **Phase 3**: US2 - Authentication (security gate)
4. ✅ **Phase 4**: US1 - View & Search (MVP is ready!)
5. 🎉 **STOP and VALIDATE**: Deploy MVP, gather feedback
6. Then add US3 → US4 → US5 → US6 based on feedback

**MVP Delivers**: Authenticated team members can browse, search, and view all existing documentation. Import initial content manually or via seed script.

### Strategy 2: Incremental Delivery (Recommended for Team)

**Goal**: Deliver value continuously

1. ✅ Setup + Foundational → Foundation Ready
2. ✅ US2 (Auth) → Security Gate Working
3. ✅ US1 (View/Search) → **DEPLOY MVP #1** 🚀 (read-only knowledge base)
4. ✅ US3 (Create/Edit) → **DEPLOY MVP #2** 🚀 (living documentation)
5. ✅ US4 (Categories) → **DEPLOY MVP #3** 🚀 (organized content)
6. ✅ US5 (Q&A) → **DEPLOY MVP #4** 🚀 (community knowledge)
7. ✅ US6 (Import) → **DEPLOY Final** 🚀 (full migration complete)

Each deployment adds value without breaking previous features.

### Strategy 3: Parallel Team (Recommended for Team of 3+)

**Goal**: Maximize team velocity

1. **Together**: Complete Phase 1 (Setup) + Phase 2 (Foundational)
2. **Together**: Complete Phase 3 (US2 - Authentication) - critical gate
3. **Split Work After US2**:
   - Developer A: US1 (View/Search) - P1
   - Developer B: US3 (Create/Edit) - P2
   - Developer C: US5 (Q&A) - P3
4. US1 completes first → Deploy MVP #1
5. US3 completes → Integrate with US1 → Deploy MVP #2
6. **Developer A** (freed up): Start US4 (Categories)
7. US5 completes → Integrate → Deploy MVP #3
8. US4 completes → Deploy MVP #4
9. **Developer B** (freed up): Start US6 (Import)
10. US6 completes → Deploy Final

**Note**: US4 depends on US3, and US6 depends on US3+US4, so timing matters.

---

## Task Count Summary

- **Phase 1 (Setup)**: 12 tasks
- **Phase 2 (Foundational)**: 30 tasks (CRITICAL PATH)
- **Phase 3 (US2 - Authentication)**: 10 tasks
- **Phase 4 (US1 - View/Search)**: 24 tasks
- **Phase 5 (US3 - Create/Edit)**: 23 tasks
- **Phase 6 (US4 - Categories)**: 18 tasks
- **Phase 7 (US5 - Q&A)**: 22 tasks
- **Phase 8 (US6 - Import)**: 20 tasks
- **Phase 9 (Polish)**: 35 tasks

**Total Tasks**: 195 tasks

**MVP Task Count** (Setup + Foundational + US2 + US1): 76 tasks

**Parallel Opportunities**: 83 tasks marked [P] can run in parallel within their phase

---

## Notes

- ✅ All tasks follow strict checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
- ✅ Tasks organized by user story for independent implementation and testing
- ✅ Each user story has clear goal, test criteria, and completion checkpoint
- ✅ Dependencies are explicit and prevent blocking work
- ✅ MVP path is clearly identified (Setup + Foundational + US2 + US1)
- ✅ Parallel opportunities maximize team efficiency
- ✅ Tests are OPTIONAL and not included (not explicitly requested in spec)
- 📝 Commit after completing each task or logical group
- 🛑 Stop at any checkpoint to validate story independently
- 🚀 Deploy early and often - each user story adds value
