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

## Testing IMAP Email Integration

**Prerequisites**: Working IMAP email account (Gmail, Outlook, ionos.de, etc.)

1. **Add Email Account**: 
   - Go to Dashboard Settings → Email Accounts
   - Add IMAP server details (host, port, security, credentials)
   - Test connection to verify credentials

2. **Sync Emails**:
   - Use the sync button or call `/imap/sync/:emailAccountId` endpoint
   - Check database with `pnpm db:studio` to verify emails are stored
   - Return to dashboard to see emails displayed

3. **Verify Email Display**:
   - Dashboard should show correct inbox/sent counts
   - Email list should display subjects, senders, timestamps
   - Click emails to view content

**Example IMAP Settings**:
- **Gmail**: `imap.gmail.com:993` (TLS, app password required)
- **Outlook**: `outlook.office365.com:993` (TLS)
- **ionos.de**: `imap.ionos.de:993` (TLS) - tested and working

## Project Structure

```
noessi-mail/
├── apps/
│   ├── web/                    # Next.js frontend (port 3000)
│   │   ├── src/app/           # Next.js app router pages
│   │   ├── src/components/ui/ # Reusable UI components
│   │   └── src/services/      # API service layer (email, auth)
│   └── api/                   # NestJS backend (port 3001)
│       ├── src/auth/          # JWT authentication
│       ├── src/email/         # Email CRUD operations
│       ├── src/email-account/ # IMAP account management
│       ├── src/imap/          # IMAP connection & sync services
│       └── src/encryption/    # AES-256-GCM encryption
├── packages/
│   ├── database/              # Prisma schema and client
│   ├── types/                 # Shared TypeScript interfaces
│   └── config/                # Shared configuration
├── docker-compose.yml         # PostgreSQL & Redis
├── CLAUDE.md                  # Comprehensive project documentation
└── API_ERROR_HANDLING.md      # API response structure guide
```

## Key Features Implemented

- ✅ **Full IMAP Integration**: Real email server connections, sync, parsing, and display
- ✅ **JWT Authentication**: Secure login/logout with token refresh
- ✅ **Encrypted Storage**: AES-256-GCM encryption for sensitive data
- ✅ **Modern UI**: Responsive design with animations and loading states
- ✅ **Standardized APIs**: Consistent `{success, data, meta}` response structure
- ✅ **Email Management**: Complete CRUD operations with stats and search
