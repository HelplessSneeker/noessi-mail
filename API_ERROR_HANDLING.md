# Enhanced API Error Handling

This document describes the improved error handling system implemented in the NestJS API for better developer experience in browser dev console network tab.

## Features

### 1. Comprehensive Error Responses

**Before (Basic):**
```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "path": "/api/users"
}
```

**After (Enhanced):**
```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "code": "VALIDATION_ERROR",
    "message": "Email address is required",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    },
    "timestamp": "2023-01-01T00:00:00.000Z",
    "path": "/api/users",
    "method": "POST",
    "requestId": "req_1640995200000_abc123def"
  },
  "debug": {
    "stack": "Error: Email validation failed...",
    "originalError": {...},
    "prismaError": {...}
  }
}
```

### 2. Structured Success Responses

**Before (Inconsistent):**
```json
{
  "message": "User created",
  "user": {...}
}
```

**After (Consistent):**
```json
{
  "success": true,
  "data": {
    "message": "User created",
    "user": {...}
  },
  "meta": {
    "timestamp": "2023-01-01T00:00:00.000Z",
    "path": "/api/users",
    "method": "POST",
    "requestId": "req_1640995200000_xyz789abc",
    "statusCode": 201
  }
}
```

### 3. Specialized Error Handling

#### Prisma Database Errors
- **P2002 (Unique Constraint)**: `DUPLICATE_RECORD`
- **P2025 (Record Not Found)**: `RECORD_NOT_FOUND`
- **P2003 (Foreign Key)**: `FOREIGN_KEY_CONSTRAINT`
- **P2014 (Invalid ID)**: `INVALID_ID`

#### HTTP Status Code Mapping
- **400**: `BAD_REQUEST`
- **401**: `UNAUTHORIZED`
- **403**: `FORBIDDEN`  
- **404**: `NOT_FOUND`
- **409**: `CONFLICT`
- **422**: `VALIDATION_ERROR`
- **429**: `RATE_LIMIT_EXCEEDED`
- **500**: `INTERNAL_SERVER_ERROR`

### 4. Security Features

#### Request Body Sanitization
Automatically redacts sensitive fields:
- `password` → `[REDACTED]`
- `token` → `[REDACTED]`
- `secret` → `[REDACTED]`
- `accessToken` → `[REDACTED]`
- `refreshToken` → `[REDACTED]`

#### Development-Only Debug Info
Stack traces and detailed error info only included when `NODE_ENV=development`.

### 5. Enhanced Headers

**Request Tracing:**
```
X-Request-ID: req_1640995200000_abc123def
X-Error-Code: VALIDATION_ERROR
```

### 6. Comprehensive Logging

**Client Errors (4xx):**
```
WARN [GlobalExceptionFilter] Client error [VALIDATION_ERROR]: Email address is required
```

**Server Errors (5xx):**
```
ERROR [GlobalExceptionFilter] Internal server error with full stack trace and context
```

## Usage Examples

### Testing Error Responses

The API includes demo endpoints for testing:

**Success Response:**
```
GET /demo/success
```

**Validation Error:**
```
GET /demo/error/validation
```

**Not Found Error:**
```
GET /demo/error/not-found
```

**Server Error:**
```
GET /demo/error/server
```

**Database Error:**
```
GET /demo/error/database/invalid-id
```

**Duplicate Record Error:**
```
POST /demo/error/duplicate
Content-Type: application/json

{
  "email": "existing@example.com"
}
```

## Benefits for Developers

### 1. Better Debugging
- **Request IDs** for tracing requests across logs
- **Error codes** for programmatic error handling
- **Detailed context** about what went wrong

### 2. Consistent API Responses
- All responses follow the same structure
- Easy to handle in frontend applications
- Clear success/error indicators

### 3. Security & Privacy
- Sensitive data automatically redacted
- Stack traces only in development
- Structured logging for monitoring

### 4. Developer Experience
- Clear error messages in browser dev console
- Consistent error codes for frontend handling
- Rich metadata for debugging

## Implementation Files

- **Global Exception Filter**: `/src/filters/global-exception.filter.ts`
- **Response Interceptor**: `/src/interceptors/response.interceptor.ts`
- **Demo Controller**: `/src/demo/demo.controller.ts`
- **Logging Service**: `/src/logging/logging.service.ts`

This enhanced error handling system provides a professional, developer-friendly API experience with comprehensive error information and consistent response structures.