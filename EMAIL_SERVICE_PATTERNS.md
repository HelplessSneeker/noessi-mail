# Email Service Patterns & IMAP Integration

This document covers the email service implementation patterns learned from debugging the complete IMAP integration and email display system.

## Service Layer Architecture

### API Response Handling Pattern

All email service methods follow this pattern to handle the standardized `{success, data, meta}` API response structure:

```typescript
async getEmails(params: EmailListParams = {}): Promise<EmailListResponse> {
  const response = await fetch(`${API_BASE_URL}/emails?${searchParams}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch emails');
  }

  const result = await response.json();
  return result.data; // Extract data from {success, data, meta}
}
```

### Authentication Token Management

**Correct Pattern:**
```typescript
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken'); // Use 'accessToken'
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};
```

**Authentication Flow:**
1. Login → Store `accessToken` and `refreshToken`
2. API calls → Use `accessToken` from localStorage
3. Token refresh → Automatically handled by axios interceptor
4. Logout → Clear both tokens

## IMAP Integration Status

### Complete Email Pipeline

✅ **IMAP Connection**: Real server connections with TLS/STARTTLS security
✅ **Email Parsing**: Full RFC 2822 compliance with `mailparser`
✅ **Database Storage**: Encrypted persistence with Prisma
✅ **Frontend Display**: Subject, sender, timestamps, body previews
✅ **Stats Integration**: Real-time inbox/sent/unread counts

### Working IMAP Providers

| Provider | Host | Port | Security | Status |
|----------|------|------|----------|---------|
| ionos.de | `imap.ionos.de` | 993 | TLS | ✅ Tested |
| Gmail | `imap.gmail.com` | 993 | TLS | ✅ Supported* |
| Outlook | `outlook.office365.com` | 993 | TLS | ✅ Supported |

*Gmail requires app-specific password

### Sync Process Flow

```
1. User adds email account with IMAP credentials
2. Test connection: POST /imap/test-connection
3. Manual sync: POST /imap/sync/:emailAccountId
4. Email parsing: Headers + body + attachments
5. Database storage: Encrypted, deduplicated by messageId
6. Frontend refresh: Automatic stats and list updates
```

## Debugging Email Display Issues

### Debugging Chain

Follow this systematic approach when emails aren't displaying:

```
Database → API → Frontend Service → UI Component
    ↓        ↓         ↓               ↓
Prisma   Express   Service Layer   React Query
Studio   /emails   .data extract   Transform
```

### Step-by-Step Debugging

**1. Verify Database State**
```bash
pnpm db:studio
# Check 'Email' table for records
# Verify userId matches logged-in user
```

**2. Test API Endpoints**
```javascript
// Browser console
fetch('http://localhost:3001/emails?limit=5', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);
```

**3. Check Service Layer**
```typescript
// Verify service extracts result.data
const result = await response.json();
return result.data; // Must extract data!
```

**4. UI Component Data Flow**
```typescript
// EmailList component
const { data: emailsData } = useQuery(['emails', folder], () => 
  emailService.getEmails({ folder })
);
const emails = emailsData?.emails?.map(emailService.transformToFrontendEmail) || [];
```

### Common Issues & Solutions

| Issue | Symptom | Root Cause | Solution |
|-------|---------|------------|----------|
| NaN in stats | Dashboard shows "NaN emails" | Service not extracting `result.data` | Fix service methods |
| Empty email list | No emails despite sync | API response structure mismatch | Extract `result.data` |
| 401 errors | Authentication failures | Token key mismatch | Use `accessToken` consistently |
| Connection errors | IMAP sync fails | Expired/invalid credentials | Refresh email account settings |

## Email Service Implementation

### Complete Service Methods

```typescript
export const emailService = {
  // All methods follow the pattern:
  // 1. Fetch from API
  // 2. Check response.ok
  // 3. Extract result.data
  // 4. Return typed data

  async getEmails(params): Promise<EmailListResponse>,
  async getEmailById(id): Promise<EmailResponse>,
  async getEmailStats(): Promise<EmailStats>,
  async markAsRead(id): Promise<EmailResponse>,
  async markAsUnread(id): Promise<EmailResponse>,
  async toggleStar(id): Promise<EmailResponse>,
  async deleteEmail(id): Promise<void>,
  
  // Transformation for UI compatibility
  transformToFrontendEmail(apiEmail): Email,
  
  // Legacy methods for backward compatibility
  getEmailsByFolder(folder): Promise<Email[]>,
  getEmailById_Legacy(id): Promise<Email | undefined>,
};
```

### Testing Email Integration

**Manual IMAP Sync:**
```bash
curl -X POST http://localhost:3001/imap/sync/EMAIL_ACCOUNT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"folder": "INBOX", "limit": 20, "fetchBody": true}'
```

**Verify Email Display:**
1. Check dashboard stats show correct counts
2. Email list displays with subjects/senders
3. Click email to view full content
4. Verify timestamps and read status

## Type Safety & Data Contracts

### Frontend-Backend Data Contract

```typescript
// Backend API Response
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
    statusCode: number;
  };
}

// Frontend Service Layer
interface EmailListResponse {
  emails: EmailResponse[];
  total: number;
  page: number;
  limit: number;
}

// UI Component Layer
interface Email {
  id: string;
  from: { name: string; email: string };
  subject: string;
  body: string;
  date: Date;
  isRead: boolean;
  // ... other UI-specific fields
}
```

The service layer transforms between backend API format and frontend UI format, ensuring type safety and consistent data structures throughout the application.