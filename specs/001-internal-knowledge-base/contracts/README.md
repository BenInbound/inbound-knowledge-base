# API Contracts

This directory contains the API contracts and specifications for the Internal Knowledge Base platform.

## Files

### api-spec.yaml

OpenAPI 3.1 specification for all REST API endpoints. This document defines:

- **Authentication**: Bearer token (Supabase JWT)
- **Endpoints**: Articles, Categories, Search, Q&A, Import
- **Request/Response Schemas**: Complete TypeScript-compatible schemas
- **Validation Rules**: Min/max lengths, patterns, enums
- **Error Responses**: Standardized error format

### Usage

**Viewing the Spec**:
```bash
# Using Swagger UI (recommended)
npx swagger-ui-serve contracts/api-spec.yaml

# Using Redoc
npx redoc-cli serve contracts/api-spec.yaml
```

**Generating TypeScript Types**:
```bash
# Install openapi-typescript
npm install -D openapi-typescript

# Generate types
npx openapi-typescript contracts/api-spec.yaml -o lib/types/api.ts
```

**API Client Generation**:
```bash
# Using openapi-generator
npx @openapitools/openapi-generator-cli generate \
  -i contracts/api-spec.yaml \
  -g typescript-fetch \
  -o lib/api-client
```

## Endpoint Summary

### Articles (`/api/articles`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/articles` | List articles with filters | Required |
| POST | `/articles` | Create article | Required |
| GET | `/articles/{id}` | Get article by ID | Required |
| GET | `/articles/slug/{slug}` | Get article by slug | Required |
| PATCH | `/articles/{id}` | Update article | Author only |
| DELETE | `/articles/{id}` | Delete article | Admin only |

**Key Features**:
- Filter by status (draft/published/archived)
- Filter by category or author
- Pagination support
- Rich text content (TipTap JSON)

### Categories (`/api/categories`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/categories` | List categories | Required |
| POST | `/categories` | Create category | Admin only |
| GET | `/categories/{id}` | Get category with articles | Required |
| PATCH | `/categories/{id}` | Update category | Admin only |
| DELETE | `/categories/{id}` | Delete category | Admin only |

**Key Features**:
- Hierarchical structure (parent-child)
- Tree view option (`include_tree=true`)
- Article count per category
- Sort order support

### Search (`/api/search`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/search?q={query}` | Full-text search | Required |

**Key Features**:
- Searches articles and questions
- Relevance ranking
- Text snippets with match context
- Filter by content type
- Max 50 results per request

### Q&A (`/api/qa`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/qa/questions` | List questions | Required |
| POST | `/qa/questions` | Create question | Required |
| GET | `/qa/questions/{id}` | Get question with answers | Required |
| PATCH | `/qa/questions/{id}` | Update question | Author only |
| DELETE | `/qa/questions/{id}` | Delete question | Author only |
| POST | `/qa/questions/{id}/answers` | Create answer | Required |
| PATCH | `/qa/answers/{id}` | Update answer | Author only |
| DELETE | `/qa/answers/{id}` | Delete answer | Author only |
| POST | `/qa/answers/{id}/accept` | Accept answer | Question author |

**Key Features**:
- Filter by answered status
- One accepted answer per question
- Auto-mark question as answered
- Answer count tracking

### Import (`/api/import`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/import/tettra` | Upload Tettra export | Admin only |
| GET | `/import/jobs/{id}` | Get import job status | Admin only |

**Key Features**:
- Accepts CSV or JSON files
- Dry-run mode for validation
- Detailed error reporting
- Progress tracking

## Authentication

All endpoints require authentication via Supabase JWT token:

```http
Authorization: Bearer <supabase-jwt-token>
```

**Getting Token** (client-side):
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token
```

**Email Domain Restriction**:
- Only `@inbound.no` emails can authenticate
- Enforced at database level (Supabase Auth Hook)
- Cannot be bypassed via API

## Authorization Rules

| Resource | View | Create | Update | Delete |
|----------|------|--------|--------|--------|
| Articles (published) | All users | - | - | - |
| Articles (own draft) | Author | Author | Author | Admin |
| Categories | All users | Admin | Admin | Admin |
| Questions | All users | All users | Author | Author |
| Answers | All users | All users | Author | Author |
| Import Jobs | Admin | Admin | - | - |

Authorization is enforced via:
1. **Row Level Security (RLS)** in Supabase
2. **API route checks** in Next.js
3. **Middleware** for route protection

## Error Responses

All errors follow this format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": "validation error details"
  }
}
```

**Common Error Codes**:
- `UNAUTHORIZED` (401): Missing or invalid token
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Invalid input
- `CONFLICT` (409): Duplicate resource (slug, etc.)
- `INTERNAL_ERROR` (500): Server error

## Rate Limiting

- **Search**: 10 requests/minute per user
- **Create Operations**: 30 requests/minute per user
- **Other Operations**: 100 requests/minute per user

Rate limits enforced via Vercel Edge Middleware.

## Pagination

List endpoints support pagination:

**Query Parameters**:
- `limit`: Results per page (default: 20, max: 100)
- `offset`: Starting position (default: 0)

**Response Format**:
```json
{
  "data": [...],
  "total": 250,
  "limit": 20,
  "offset": 0
}
```

**Next Page**:
```
/api/articles?limit=20&offset=20
```

## Versioning

Current version: `v1` (implicit, no version prefix needed)

Future versions will use URL prefix: `/api/v2/...`

## Testing

**Local Development**:
```bash
# Start Next.js dev server
npm run dev

# API available at http://localhost:3000/api
```

**Example Requests**:

```bash
# Get auth token first (login via UI or Supabase CLI)
export TOKEN="your-supabase-jwt-token"

# List published articles
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/articles?status=published

# Search
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/search?q=onboarding"

# Create article
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"New Article","content":{"type":"doc","content":[]},"status":"draft"}' \
  http://localhost:3000/api/articles
```

## Contract Testing

API contract tests ensure implementation matches spec:

```bash
# Run contract tests
npm run test:contract

# Test files location
tests/contract/api-*.test.ts
```

Tests validate:
- Response schemas match OpenAPI spec
- Status codes are correct
- Error responses follow format
- Authorization rules work
- Validation rules are enforced

## Next Steps

1. Implement API routes in `/app/api/`
2. Generate TypeScript types from OpenAPI spec
3. Create API client library
4. Write contract tests
5. Set up API documentation hosting (Swagger UI)
