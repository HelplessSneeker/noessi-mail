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
✅ **Complete**: Auth (JWT), encryption (AES-256-GCM), email accounts, IMAP integration, email sync/parsing, email display, UI framework, i18n, animations, loading states
🚧 **Next**: Email composer, OAuth2, real-time email updates, advanced email features (threading, search, filters)

## Key Fixes Applied
1. **Crypto API**: Use `createCipheriv`/`createDecipheriv` (not `createCipherGCM`)
2. **Email Form**: Filter empty strings before API submission (NestJS validation)
3. **JWT Auth**: Include `userId` in strategy return for proper user relations
4. **API Response Structure**: Frontend services extract `result.data` from standardized `{success, data, meta}` API responses
5. **Authentication Tokens**: Use consistent `accessToken` key in localStorage (not `token`)
6. **Email Display Chain**: Fixed service layer data extraction enabling full email list rendering

## IMAP Implementation
**Status**: ✅ **Fully Operational** - Complete email sync and display pipeline working
**Architecture**: Connection pooling + email parsing + sync service with TLS/STARTTLS security
**Dependencies**: `node-imap` + `mailparser` for RFC 2822 compliance
**Endpoints**: `/imap/test-connection`, `/imap/sync/:id`, `/imap/folders/:id`, `/imap/status/:id`
**Features**: Incremental sync, email threading, attachment parsing, connection health monitoring
**Capabilities**: 
- Real IMAP server connection (tested with ionos.de)
- Full email parsing (headers, body, HTML, attachments)
- Database persistence with encryption
- Frontend display with subject, sender, timestamps, previews
- Stats integration (inbox count, unread count, etc.)
**Testing**: Use existing email account credentials in dashboard settings

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
- **Services**: `apps/web/src/services/` (email, auth API integration)
- **API**: `apps/api/src/*/` (auth, email-account, encryption, imap)
- **IMAP**: `apps/api/src/imap/` (connection, parsing, sync services)
- **Database**: `packages/database/prisma/schema.prisma`
- **Types**: `packages/types/index.ts`

## Documentation
- **CLAUDE.md**: Comprehensive project overview and troubleshooting
- **API_ERROR_HANDLING.md**: Standardized API response patterns
- **EMAIL_SERVICE_PATTERNS.md**: Email integration and service layer guide
- **README.md**: Quick start and testing instructions

## Environment
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001  
- **Database**: PostgreSQL via Docker
- **Encryption**: AES-256-GCM (enabled, transparent via Prisma middleware)

## Error Handling
Global exception filters provide structured error responses. Demo endpoints at `/demo/*` for testing.

## API Response Structure
**Pattern**: All API responses follow `{success: boolean, data: T | null, meta: object}` structure
**Frontend Services**: Must extract `result.data` from API responses (see `apps/web/src/services/email.service.ts`)
**Authentication**: Use `accessToken` localStorage key consistently across services
**Type Safety**: Frontend interfaces should match actual API response data structures

## Troubleshooting Email Display
**Debugging Chain**: Database → API Endpoints → Frontend Services → UI Components
1. **Check Database**: Use `pnpm db:studio` to verify emails exist in database
2. **Test API**: Direct API calls (e.g., `GET /emails?limit=5`) should return structured data
3. **Verify Services**: Email service methods should extract `result.data` from API responses
4. **Check Components**: UI components should receive properly transformed data

**Common Issues**:
- "NaN" in stats: API response structure mismatch in service layer
- Empty email lists: Service layer not extracting `data` from API response
- 401 errors: Token key mismatch (`accessToken` vs `token` in localStorage)
- Connection errors: Check IMAP credentials and sync status

**IMAP Sync**: Use `/imap/sync/:emailAccountId` endpoint to manually trigger email sync for testing

---
*Keep documentation concise - Claude can infer implementation details from code.*