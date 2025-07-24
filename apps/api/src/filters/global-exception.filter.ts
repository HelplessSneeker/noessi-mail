import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomLoggerService } from '../logging/logging.service';
import { Prisma } from '@noessi/database';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: CustomLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Enhanced error analysis
    const errorInfo = this.analyzeError(exception, request);
    
    // Build comprehensive error response
    const errorResponse = {
      success: false,
      error: {
        statusCode: errorInfo.status,
        code: errorInfo.code,
        message: errorInfo.message,
        details: errorInfo.details,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        requestId: this.generateRequestId(),
      },
      // Include debugging info in development
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          stack: errorInfo.stack,
          originalError: errorInfo.originalError,
          prismaError: errorInfo.prismaError,
        },
      }),
    };

    // Enhanced logging with more context
    const userId = (request as any).user?.sub;
    const errorDetails = {
      requestId: errorResponse.error.requestId,
      statusCode: errorInfo.status,
      errorCode: errorInfo.code,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      userId,
      body: request.method !== 'GET' ? this.sanitizeRequestBody(request.body) : undefined,
      query: Object.keys(request.query).length > 0 ? request.query : undefined,
    };

    if (errorInfo.status >= 500) {
      // Server errors - log as errors with full stack trace
      this.logger.logError(
        exception instanceof Error ? exception : new Error(String(exception)),
        'GlobalExceptionFilter',
        errorDetails
      );
    } else {
      // Client errors - log as warnings with context
      this.logger.warn(
        `Client error [${errorInfo.code}]: ${errorInfo.message}`,
        'GlobalExceptionFilter'
      );
    }

    // Set additional headers for better debugging
    response.setHeader('X-Request-ID', errorResponse.error.requestId);
    response.setHeader('X-Error-Code', errorInfo.code);
    
    response.status(errorInfo.status).json(errorResponse);
  }

  private analyzeError(exception: unknown, _request: Request) {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: any = null;
    let stack: string | undefined;
    let originalError: any = null;
    let prismaError: any = null;

    // Handle HttpException
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      
      if (typeof response === 'object' && response !== null) {
        message = (response as any).message || message;
        code = (response as any).error || this.getErrorCodeFromStatus(status);
        details = (response as any).details || null;
      } else {
        message = response as string;
        code = this.getErrorCodeFromStatus(status);
      }
      
      stack = exception.stack;
      originalError = {
        name: exception.name,
        message: exception.message,
      };
    }
    // Handle Prisma errors
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaInfo = this.handlePrismaError(exception);
      status = prismaInfo.status;
      message = prismaInfo.message;
      code = prismaInfo.code;
      details = prismaInfo.details;
      prismaError = {
        code: exception.code,
        meta: exception.meta,
        target: (exception.meta as any)?.target,
      };
      stack = exception.stack;
    }
    else if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Database operation failed';
      code = 'DATABASE_ERROR';
      details = { type: 'Unknown database error' };
      prismaError = { message: exception.message };
      stack = exception.stack;
    }
    else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid database query parameters';
      code = 'VALIDATION_ERROR';
      details = { type: 'Database validation error' };
      prismaError = { message: exception.message };
      stack = exception.stack;
    }
    // Handle other errors
    else if (exception instanceof Error) {
      message = exception.message || 'Unknown error occurred';
      code = 'UNKNOWN_ERROR';
      stack = exception.stack;
      originalError = {
        name: exception.name,
        message: exception.message,
      };
    }
    // Handle unknown exceptions
    else {
      message = 'An unexpected error occurred';
      code = 'UNEXPECTED_ERROR';
      originalError = String(exception);
    }

    return {
      status,
      message,
      code,
      details,
      stack,
      originalError,
      prismaError,
    };
  }

  private handlePrismaError(error: Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          message: 'A record with this information already exists',
          code: 'DUPLICATE_RECORD',
          details: {
            constraint: (error.meta as any)?.target,
            fields: (error.meta as any)?.target,
          },
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          code: 'RECORD_NOT_FOUND',
          details: {
            cause: error.meta?.cause,
          },
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Foreign key constraint failed',
          code: 'FOREIGN_KEY_CONSTRAINT',
          details: {
            field: (error.meta as any)?.field_name,
          },
        };
      case 'P2014':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid ID provided',
          code: 'INVALID_ID',
          details: {
            details: error.meta?.details,
          },
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database operation failed',
          code: 'DATABASE_ERROR',
          details: {
            prismaCode: error.code,
            meta: error.meta,
          },
        };
    }
  }

  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.METHOD_NOT_ALLOWED:
        return 'METHOD_NOT_ALLOWED';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMIT_EXCEEDED';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'INTERNAL_SERVER_ERROR';
      case HttpStatus.BAD_GATEWAY:
        return 'BAD_GATEWAY';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'SERVICE_UNAVAILABLE';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'accessToken', 'refreshToken'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}