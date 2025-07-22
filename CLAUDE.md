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
- **Frontend**: Next.js 14 (App Router), React Query, Tailwind CSS, ShadCN UI
- **Backend**: NestJS, Passport JWT, Prisma ORM
- **Database**: PostgreSQL with Prisma
- **Monorepo**: Turborepo with PNPM workspaces
- **Auth**: JWT with refresh token rotation

## Common Commands
```bash
# Development
pnpm dev              # Start all apps
pnpm build            # Build all apps
pnpm lint             # Lint all apps

# Database
pnpm db:push          # Push schema changes
pnpm db:migrate       # Create migration
pnpm db:studio        # Open Prisma Studio
pnpm db:generate      # Generate Prisma client

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
- NEXT_PUBLIC_API_URL: Backend URL for frontend

## Current Implementation Status
✅ Authentication (register, login, logout, refresh)
✅ Protected routes
✅ User management
⏳ Email account integration
⏳ IMAP/SMTP functionality
⏳ Email UI components

## API Endpoints
- POST /auth/register - User registration
- POST /auth/login - User login
- POST /auth/logout - User logout
- POST /auth/refresh - Refresh tokens
- POST /auth/me - Get current user (protected)

## Database Schema
- User: id, email, password, name, isEmailVerified
- RefreshToken: token storage with expiry
- EmailAccount: OAuth tokens for email providers (planned)

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

## Architecture Decisions
1. **Monorepo**: Shared code between frontend/backend
2. **JWT Refresh**: Security with good UX
3. **Prisma**: Type-safe database access
4. **React Query**: Efficient server state management
5. **Docker**: Consistent dev environment

## Current Tasks
1. Implement email account connection (OAuth2)
2. Create IMAP service for fetching emails
3. Design email list and viewer components
4. Add email search functionality
5. Implement email composer

## Important Files
- `/apps/api/src/auth/` - Authentication logic
- `/apps/web/src/services/auth.service.ts` - Frontend auth
- `/packages/database/prisma/schema.prisma` - Database schema
- `/apps/web/src/app/dashboard/page.tsx` - Protected route example