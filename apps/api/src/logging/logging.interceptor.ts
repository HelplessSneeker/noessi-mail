import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { CustomLoggerService } from './logging.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: CustomLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();
    
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    
    // Get user ID from JWT payload if available
    const userId = (request as any).user?.sub;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        this.logger.logApiCall(
          method,
          url,
          response.statusCode,
          duration,
          userId,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - now;
        
        this.logger.logApiCall(
          method,
          url,
          error.status || 500,
          duration,
          userId,
        );

        this.logger.logError(error, 'HTTP', {
          method,
          url,
          ip,
          userAgent,
          userId,
        });

        throw error;
      }),
    );
  }
}