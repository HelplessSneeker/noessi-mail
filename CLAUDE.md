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
✅ **Complete**: Auth (JWT), encryption (AES-256-GCM), email accounts, IMAP integration, email sync/parsing, UI framework, i18n, animations, loading states
🚧 **Next**: Email composer, OAuth2, real-time email updates

## Key Fixes Applied
1. **Crypto API**: Use `createCipheriv`/`createDecipheriv` (not `createCipherGCM`)
2. **Email Form**: Filter empty strings before API submission (NestJS validation)
3. **JWT Auth**: Include `userId` in strategy return for proper user relations

## IMAP Implementation
**Architecture**: Connection pooling + email parsing + sync service with TLS/STARTTLS security
**Dependencies**: `node-imap` + `mailparser` for RFC 2822 compliance
**Endpoints**: `/imap/test-connection`, `/imap/sync/:id`, `/imap/folders/:id`, `/imap/status/:id`
**Features**: Incremental sync, email threading, attachment parsing, connection health monitoring

## UI/UX System
**Theme**: Noessi Mail blue (`--brand-primary: 217 91% 60%`) with comprehensive HSL variables in `globals.css`
**Animations**: Optimized Tailwind config with fadeIn/Out, slideIn/Out, scaleIn/Out + `ease-out` preferred over heavy easing
**Transitions**: State-managed with `isTransitioning` + 200-300ms delays, opacity-based for smooth content swapping
**Loading**: Multi-variant spinner system (`default`, `dots`, `pulse`, `ripple`) + static skeletons for structure preview
**Performance**: Avoid animation conflicts (skeleton + transition), prefer `opacity`/`transform` over layout shifts
**Responsive**: Mobile-first breakpoints (sm/md/lg) with adaptive layouts

## Custom Commands
- `/improve-ui [route|component]` - UI/UX improvements with Playwright automation

## File Patterns
- **Components**: `apps/web/src/components/ui/`
- **Pages**: `apps/web/src/app/*/page.tsx`
- **API**: `apps/api/src/*/` (auth, email-account, encryption, imap)
- **IMAP**: `apps/api/src/imap/` (connection, parsing, sync services)
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