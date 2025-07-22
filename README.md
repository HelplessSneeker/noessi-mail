# Noessi Mail

Modern email client built with Next.js, NestJS, and PostgreSQL.

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start Docker services:
   ```bash
   docker-compose up -d
   ```

3. Push database schema:
   ```bash
   pnpm db:push
   ```

4. Start development servers:
   ```bash
   pnpm dev
   ```

## URLs

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Database: localhost:5432
- Redis: localhost:6379

## Testing Authentication

1. Go to http://localhost:3000
2. Click "Register" and create an account
3. You'll be redirected to the dashboard
4. Try logging out and logging back in
5. Try accessing the dashboard without being logged in

## Project Structure

```
noessi-mail/
├── apps/
│   ├── web/        # Next.js frontend
│   └── api/        # NestJS backend
├── packages/
│   ├── database/   # Prisma schema and client
│   ├── types/      # Shared TypeScript types
│   └── config/     # Shared configuration
└── docker-compose.yml
```
