# CLAUDE.md

## Project Setup
**Noessi Mail**: Modern email client - Next.js frontend + NestJS backend + PostgreSQL

```
apps/web/     # Next.js (port 3000) - Tailwind, Radix UI, TanStack Query, i18n
apps/api/     # NestJS (port 3001) - JWT auth, Prisma, encryption, logging
packages/     # Shared database, types, config
```

## Development
```bash
pnpm dev                    # Start both servers
pnpm build && pnpm lint     # Build and validate
pnpm db:push                # Update database schema
```

**Test Credentials**: `test@example.com` / `password123`

## Current Status
✅ **Complete**: Auth (JWT), encryption (AES-256-GCM), email accounts, UI framework, i18n
🚧 **Next**: Email composer, OAuth2, IMAP integration, real email fetching

## Key Fixes Applied
1. **Crypto API**: Use `createCipheriv`/`createDecipheriv` (not `createCipherGCM`)
2. **Email Form**: Filter empty strings before API submission (NestJS validation)
3. **JWT Auth**: Include `userId` in strategy return for proper user relations

## Custom Commands
- `/improve-ui [route|component]` - UI/UX improvements with Playwright automation

## File Patterns
- **Components**: `apps/web/src/components/ui/`
- **Pages**: `apps/web/src/app/*/page.tsx`
- **API**: `apps/api/src/*/` (auth, email-account, encryption)
- **Database**: `packages/database/prisma/schema.prisma`
- **Types**: `packages/types/index.ts`

## Environment
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001  
- **Database**: PostgreSQL via Docker
- **Encryption**: AES-256-GCM (enabled, transparent via Prisma middleware)

## Error Handling
Global exception filters provide structured error responses. Demo endpoints at `/demo/*` for testing.

---
*Keep documentation concise - Claude can infer implementation details from code.*