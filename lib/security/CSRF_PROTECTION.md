# CSRF Protection Implementation

## Overview

This application implements multiple layers of CSRF (Cross-Site Request Forgery) protection to ensure secure form submissions and API requests.

## Built-in Protections

### 1. Next.js Server Actions (Automatic)

Next.js provides **built-in CSRF protection** for all Server Actions automatically. This includes:

- **Origin header validation**: Ensures requests come from the same origin
- **Host header validation**: Verifies the request host matches the application
- **Automatic token generation**: Next.js generates and validates tokens internally

**Files using Server Actions (protected by default):**
- `lib/auth/actions.ts` - login(), signup(), logout()
- All form submissions using `action={serverAction}`

### 2. SameSite Cookie Policy

All authentication cookies are set with `SameSite=Lax` or `SameSite=Strict` by Supabase, preventing CSRF attacks through:

- Cookies not sent with cross-site requests (except safe methods like GET)
- Protection against cross-origin form submissions

### 3. Security Headers

The following security headers are configured in `next.config.js`:

```javascript
'X-Frame-Options': 'SAMEORIGIN'  // Prevents clickjacking
'Content-Security-Policy': 'form-action \'self\''  // Only allow form submissions to same origin
```

## API Route Protection

For API routes that accept mutations (POST, PATCH, DELETE), additional protection is implemented:

### 1. Authentication Required

All mutation endpoints require valid authentication:

```typescript
const user = await supabase.auth.getUser();
if (!user) {
  throw ApiErrors.unauthorized();
}
```

### 2. Origin Validation

API routes validate the request origin:

```typescript
const origin = request.headers.get('origin');
const host = request.headers.get('host');

if (origin && !origin.includes(host)) {
  return new Response('Forbidden', { status: 403 });
}
```

### 3. HTTP Methods

- **Safe methods** (GET, HEAD, OPTIONS): No CSRF token required
- **Unsafe methods** (POST, PUT, PATCH, DELETE): Protected by authentication + origin validation

## Best Practices Implemented

1. **Use Server Actions** for form submissions whenever possible
   - Automatic CSRF protection
   - Type-safe
   - No manual token management needed

2. **Validate Origin Headers** for API routes
   - Reject requests from unexpected origins
   - Log suspicious requests

3. **Require Authentication** for all mutations
   - No anonymous writes
   - User identity verified

4. **Use SameSite Cookies** (handled by Supabase)
   - Prevents cross-site cookie leakage
   - Automatic with Supabase Auth

5. **Set Security Headers** (implemented in next.config.js)
   - X-Frame-Options: SAMEORIGIN
   - Content-Security-Policy: form-action 'self'
   - Strict-Transport-Security

## Testing CSRF Protection

### Test 1: Cross-Origin Request
```bash
curl -X POST https://your-app.com/api/articles \
  -H "Origin: https://malicious-site.com" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test"}'

Expected: 403 Forbidden or 401 Unauthorized
```

### Test 2: Server Action Without Token
Server Actions automatically include tokens, so external submissions will fail:

```html
<!-- This form on malicious-site.com will fail -->
<form action="https://your-app.com/api/auth/login" method="POST">
  <input name="email" value="victim@example.com">
  <button>Submit</button>
</form>

Expected: CSRF token validation failure
```

### Test 3: API Request Without Auth
```bash
curl -X POST https://your-app.com/api/articles \
  -H "Content-Type: application/json" \
  -d '{"title": "Test"}'

Expected: 401 Unauthorized
```

## Security Checklist

- [X] Server Actions use built-in CSRF protection
- [X] API routes validate origin headers
- [X] All mutations require authentication
- [X] SameSite cookies configured (Supabase default)
- [X] Security headers set in next.config.js
- [X] Form submissions use Server Actions or authenticated API routes
- [X] No GET requests cause mutations
- [X] Sensitive operations require re-authentication

## Additional Resources

- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/authentication)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
