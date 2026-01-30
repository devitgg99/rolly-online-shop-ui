# Security Best Practices & Implementation

This document outlines the security measures implemented in this application.

## 🔒 Authentication & Authorization

### ✅ Implemented
- **NextAuth.js** for secure authentication
- **JWT tokens** stored server-side only (never exposed to client)
- **Role-based access control (RBAC)** for Admin/User routes
- **Backend token** securely passed via server actions
- **Session management** with automatic expiration

### How It Works
```
Client → Server Action → getServerSession(authOptions) → Backend API
         (No token)     (Token retrieved securely)        (Token sent)
```

## 🛡️ Security Headers

The following security headers are automatically added to all responses:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevents clickjacking attacks |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer information |
| `X-XSS-Protection` | `1; mode=block` | Enables XSS filtering |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Restricts browser features |

## 🔐 Environment Variables

### Required Variables
```env
# NextAuth
NEXTAUTH_SECRET=<strong-random-secret>  # Generate: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Backend API
NEXT_PUBLIC_API_URL=https://your-backend-api.com

# Session
NEXTAUTH_SESSION_MAX_AGE=2592000  # 30 days in seconds
```

### ⚠️ Never Commit
- `.env` files
- API keys or secrets
- Backend tokens
- Database credentials

## 🚨 Secure Logging

Use the secure logger utility to prevent sensitive data exposure:

```typescript
import { logger } from '@/lib/logger';

// ✅ Good - Only logs in development
logger.info('User logged in');

// ✅ Good - Sanitizes sensitive data
const userData = logger.sanitize({ email, password, token });
logger.info('User data:', userData);

// ❌ Bad - Exposes token
console.log('Token:', backendToken);
```

## 🔒 Token Security

### Backend Token Flow
1. **Login** → Backend returns JWT
2. **NextAuth** → Stores token in server-side session
3. **Server Actions** → Retrieve token via `getServerSession(authOptions)`
4. **API Calls** → Send token to backend with `Authorization: Bearer <token>`

### Key Principles
- ✅ Token **NEVER** sent to client
- ✅ Token **NEVER** logged in production
- ✅ Token retrieved on-demand in server actions
- ✅ Token automatically refreshed by backend

## 🛡️ Data Validation

### Server-Side Validation
All input data is validated on the server:

```typescript
// ✅ Good
export async function createBrandAction(brandData: BrandRequest) {
  // Validate inputs
  if (!brandData.name?.trim()) {
    return { success: false, message: 'Name is required' };
  }
  
  // Continue with API call...
}
```

## 🚦 Rate Limiting (Recommended)

To prevent abuse, implement rate limiting:

### Option 1: Upstash Rate Limit
```bash
npm install @upstash/ratelimit @upstash/redis
```

### Option 2: API Route Rate Limiting
```typescript
// middleware.ts - Add rate limiting
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});
```

## 🔍 Security Checklist

### Before Deployment
- [ ] All environment variables set in production
- [ ] `NEXTAUTH_SECRET` is strong and random
- [ ] No console.log statements with sensitive data
- [ ] HTTPS enabled on production domain
- [ ] CORS configured properly on backend
- [ ] Rate limiting implemented
- [ ] Input validation on all forms
- [ ] SQL injection prevention (use ORMs)
- [ ] XSS prevention (React escapes by default)
- [ ] CSRF protection (NextAuth handles this)

## 🚨 Incident Response

### If Token is Compromised
1. User logs out immediately
2. Session is invalidated
3. Backend invalidates the JWT token
4. User must re-authenticate

### If Breach Detected
1. Rotate `NEXTAUTH_SECRET`
2. Force logout all users
3. Review access logs
4. Notify affected users

## 📚 Additional Resources

- [NextAuth.js Best Practices](https://next-auth.js.org/configuration/options)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)

## 🔄 Regular Updates

- Update dependencies regularly: `npm audit fix`
- Review security advisories: `npm audit`
- Keep Next.js and NextAuth.js up to date

---

**Last Updated:** January 30, 2026
**Security Contact:** [Your Email or Security Team]
