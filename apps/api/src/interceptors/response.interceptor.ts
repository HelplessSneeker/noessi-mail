import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response, Request } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    timestamp: string;
    path: string;
    method: string;
    requestId: string;
    statusCode: number;
  };
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const requestId = this.generateRequestId();
    
    // Set request ID header for tracing
    response.setHeader('X-Request-ID', requestId);

    return next.handle().pipe(
      map((data) => {
        // Don't wrap already wrapped responses (from error filters)
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Wrap successful responses
        const wrappedResponse: ApiResponse<T> = {
          success: true,
          data,
          meta: {
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            requestId,
            statusCode: response.statusCode,
          },
        };

        return wrappedResponse;
      }),
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}