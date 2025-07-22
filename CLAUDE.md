# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Modern email client with Next.js frontend, NestJS backend, and PostgreSQL database.

## Project Structure
```
noessi-mail/
├── apps/
│   ├── web/          # Next.js 14 frontend (port 3000)
│   └── api/          # NestJS backend (port 3001)
├── packages/
│   ├── database/     # Prisma ORM and schema
│   ├── types/        # Shared TypeScript types
│   └── config/       # Shared ESLint/Tailwind config
├── docker-compose.yml # PostgreSQL & Redis
└── turbo.json        # Monorepo build config
```

## Key Technologies
- **Frontend**: Next.js 14 (App Router), React Query (TanStack Query), Tailwind CSS, Radix UI
- **Backend**: NestJS, Passport JWT, Prisma ORM, Winston logging
- **Database**: PostgreSQL with Prisma
- **Monorepo**: Turborepo with PNPM workspaces
- **Auth**: JWT with refresh token rotation
- **Validation**: Class-validator and class-transformer
- **Password Hashing**: bcrypt
- **UI Components**: Radix UI primitives with custom styling
- **Internationalization**: next-intl with browser language detection

## Common Commands
```bash
# Development
pnpm dev              # Start all apps
pnpm build            # Build all apps
pnpm lint             # Lint all apps
pnpm format           # Format code with Prettier

# Database
pnpm db:push          # Push schema changes
pnpm db:migrate       # Create migration
pnpm db:studio        # Open Prisma Studio

# Docker
docker-compose up -d  # Start services
docker-compose down   # Stop services
docker-compose logs   # View logs
```

## Environment Variables
Located in `.env` at root:
- DATABASE_URL: PostgreSQL connection
- JWT_ACCESS_SECRET: Access token secret
- JWT_REFRESH_SECRET: Refresh token secret
- JWT_ACCESS_EXPIRES_IN: Access token expiration (15m)
- JWT_REFRESH_EXPIRES_IN: Refresh token expiration (7d)
- NEXT_PUBLIC_API_URL: Backend URL for frontend
- API_PORT: Backend server port (3001)

## Workspace Structure
- **@noessi/api**: NestJS backend application
- **@noessi/web**: Next.js frontend application  
- **@noessi/database**: Prisma schema and client
- **@noessi/types**: Shared TypeScript type definitions
- **@noessi/config**: Shared ESLint and Tailwind configurations

## Current Implementation Status
✅ Authentication (register, login, logout, refresh)
✅ Protected routes with JWT guards
✅ User management with bcrypt password hashing
✅ Database schema with User, RefreshToken, EmailAccount models
✅ Winston logging system with request/response interceptors
✅ Global exception filters for error handling
✅ UI component library with Radix UI primitives
✅ Internationalization (i18n) with English and German support
✅ Dashboard with email folder sidebar
⏳ Email account integration (OAuth2)
⏳ IMAP/SMTP functionality
⏳ Email UI components (inbox, compose, etc.)

## API Endpoints
- POST /auth/register - User registration
- POST /auth/login - User login
- POST /auth/logout - User logout
- POST /auth/refresh - Refresh tokens
- POST /auth/me - Get current user (protected)

## Database Schema
- **User**: id, email, password, name, isEmailVerified, timestamps, relations to RefreshToken and EmailAccount
- **RefreshToken**: token storage with expiry and user relation
- **EmailAccount**: OAuth tokens for email providers with provider info, access/refresh tokens, and expiry

## Code Style
- TypeScript strict mode
- ESLint + Prettier configured
- Functional components with hooks
- Async/await over callbacks
- Error-first handling

## Testing Approach
- Unit tests for services
- Integration tests for API endpoints
- E2E tests for critical user flows
- Mock external services (IMAP/SMTP)

## Internationalization (i18n)
The application supports multiple languages using next-intl:

### Supported Languages
- **English (en)**: Default language
- **German (de)**: Full translation support

### Implementation Details
- **Library**: next-intl for React component translations
- **Language Detection**: Automatic browser language detection via Accept-Language header
- **Message Files**: JSON files in `/apps/web/messages/` directory
- **Components**: All UI components use translation hooks (`useTranslations`)
- **Fallback**: English is used as fallback for unsupported languages

### Translation Files
- `/apps/web/messages/en.json` - English translations
- `/apps/web/messages/de.json` - German translations

### Usage in Components
```typescript
import { useTranslations } from 'next-intl';

const t = useTranslations('dashboard');
const title = t('title'); // Returns translated title
```

### Future Language Support
- Language switcher component is available (`LanguageSwitcher`) for manual language selection
- Additional languages can be added by creating new message files and updating locale configuration

## Architecture Decisions
1. **Monorepo**: Shared code between frontend/backend using PNPM workspaces
2. **JWT Refresh**: Security with good UX using access/refresh token rotation
3. **Prisma**: Type-safe database access with PostgreSQL
4. **TanStack Query**: Efficient server state management (formerly React Query)
5. **Docker**: Consistent dev environment for PostgreSQL
6. **Turborepo**: Optimized monorepo builds and caching
7. **Radix UI**: Accessible, unstyled components with custom styling
8. **Winston**: Structured logging in NestJS backend
9. **next-intl**: Browser-based language detection for seamless i18n experience

## Current Tasks
1. Implement email account connection (OAuth2)
2. Create IMAP service for fetching emails
3. Design email list and viewer components
4. Add email search functionality
5. Implement email composer

## Important Files
- `/apps/api/src/auth/` - Authentication logic with controllers, services, guards, strategies
- `/apps/api/src/logging/` - Winston logging configuration
- `/apps/api/src/filters/` - Global exception filters
- `/apps/web/src/services/auth.service.ts` - Frontend auth service
- `/apps/web/src/lib/api-client.ts` - Axios API client configuration
- `/packages/database/prisma/schema.prisma` - Database schema
- `/apps/web/src/app/dashboard/page.tsx` - Dashboard with sidebar and i18n integration
- `/apps/web/src/components/ui/` - Reusable UI components with i18n support
- `/apps/web/src/components/ui/sidebar.tsx` - Email folder navigation sidebar
- `/apps/web/src/components/ui/language-switcher.tsx` - Language selection component (available for future use)
- `/apps/web/messages/` - Translation files for i18n support
- `/apps/web/src/i18n/request.ts` - Next-intl server configuration
- `/apps/web/src/lib/i18n.ts` - i18n utility functions and types