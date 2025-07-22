import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomLoggerService } from '../logging/logging.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: CustomLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ...(typeof message === 'object' ? message : { message }),
    };

    // Log the error with context
    const userId = (request as any).user?.sub;
    const errorDetails = {
      statusCode: status,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      userId,
    };

    if (status >= 500) {
      // Server errors - log as errors with full stack trace
      this.logger.logError(
        exception instanceof Error ? exception : new Error(String(exception)),
        'GlobalExceptionFilter',
        errorDetails
      );
    } else {
      // Client errors - log as warnings
      this.logger.warn(
        `Client error: ${status} ${request.method} ${request.url}`,
        'GlobalExceptionFilter'
      );
    }

    response.status(status).json(errorResponse);
  }
}