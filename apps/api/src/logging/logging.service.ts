import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class CustomLoggerService implements LoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  log(message: any, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(message, { context, trace });
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Custom methods for structured logging
  logAuth(event: string, data: any, context?: string) {
    this.logger.info(event, {
      context: context || 'Auth',
      event,
      ...data,
    });
  }

  logApiCall(method: string, url: string, statusCode: number, duration: number, userId?: string) {
    this.logger.info('API Call', {
      context: 'HTTP',
      method,
      url,
      statusCode,
      duration,
      userId,
    });
  }

  logSecurityEvent(event: string, data: any) {
    this.logger.warn('Security Event', {
      context: 'Security',
      event,
      ...data,
    });
  }

  logError(error: Error, context?: string, metadata?: any) {
    this.logger.error(error.message, {
      context,
      stack: error.stack,
      ...metadata,
    });
  }
}