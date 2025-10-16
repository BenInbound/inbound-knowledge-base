# Inbound Knowledge Base

Internal documentation and knowledge sharing platform for Inbound.no team members.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with TT Hoves Pro typography
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Auth**: Supabase Auth (restricted to @inbound.no emails)
- **Rich Text**: TipTap editor
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 20.x LTS
- pnpm 8.x or higher
- Supabase account

### Local Development

1. **Clone and install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Start development server**:
   ```bash
   pnpm dev
   ```

4. **Open browser**:
   ```
   http://localhost:3000
   ```

### Database Setup

See the [Quickstart Guide](./specs/001-internal-knowledge-base/quickstart.md) for detailed database setup instructions.

## Project Structure

```
inbound-tettra/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (protected)/       # Protected routes
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
├── lib/                   # Utilities and helpers
├── public/                # Static assets
│   └── fonts/            # TT Hoves Pro fonts
├── specs/                 # Feature specifications
│   └── 001-internal-knowledge-base/
│       ├── spec.md       # Requirements
│       ├── plan.md       # Implementation plan
│       ├── data-model.md # Database schema
│       ├── contracts/    # API contracts
│       └── quickstart.md # Setup guide
└── supabase/             # Supabase migrations
```

## Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm format       # Run Prettier
pnpm test         # Run unit tests
pnpm test:e2e     # Run E2E tests
pnpm type-check   # TypeScript type checking
```

## Features

### P1 - MVP (Highest Priority)
- ✅ Next.js project setup
- ⏳ Authentication with @inbound.no email restriction
- ⏳ Article viewing and browsing
- ⏳ Category navigation
- ⏳ Full-text search

### P2 - Essential
- ⏳ Rich text article editor (TipTap)
- ⏳ Article creation and editing
- ⏳ Category management
- ⏳ Draft/publish workflow

### P3 - Nice-to-have
- ⏳ Q&A system (questions and answers)

### P4 - Optional
- ⏳ Tettra data import

## Documentation

- [Feature Specification](./specs/001-internal-knowledge-base/spec.md)
- [Implementation Plan](./specs/001-internal-knowledge-base/plan.md)
- [Data Model](./specs/001-internal-knowledge-base/data-model.md)
- [API Contracts](./specs/001-internal-knowledge-base/contracts/api-spec.yaml)
- [Quickstart Guide](./specs/001-internal-knowledge-base/quickstart.md)
- [Research & Technology Decisions](./specs/001-internal-knowledge-base/research.md)

## Contributing

This is an internal project for Inbound.no. All team members with @inbound.no email addresses can contribute.

### Development Workflow

1. Create feature branch from `main`
2. Implement changes following the spec
3. Write tests
4. Run `pnpm lint` and `pnpm test`
5. Create pull request

## License

Internal use only - Inbound.no
