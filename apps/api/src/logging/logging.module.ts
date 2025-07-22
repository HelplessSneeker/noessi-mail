import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        const logLevel = configService.get('LOG_LEVEL') || (isProduction ? 'info' : 'debug');

        const formats = [
          winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
          }),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        ];

        // Add colorize for non-production
        if (!isProduction) {
          formats.unshift(winston.format.colorize({ all: true }));
          formats.push(winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
            let log = `${timestamp} [${level}] ${context ? `[${context}] ` : ''}${message}`;
            
            if (Object.keys(meta).length > 0) {
              log += ` ${JSON.stringify(meta)}`;
            }
            
            if (trace) {
              log += `\n${trace}`;
            }
            
            return log;
          }));
        }

        return {
          level: logLevel,
          format: winston.format.combine(...formats),
          defaultMeta: {
            service: 'noessi-api',
            environment: configService.get('NODE_ENV') || 'development',
          },
          transports: [
            new winston.transports.Console(),
            ...(isProduction ? [
              new winston.transports.File({
                filename: 'logs/error.log',
                level: 'error',
                maxsize: 5242880, // 5MB
                maxFiles: 5,
                tailable: true,
              }),
              new winston.transports.File({
                filename: 'logs/combined.log',
                maxsize: 5242880, // 5MB
                maxFiles: 5,
                tailable: true,
              }),
            ] : []),
          ],
        };
      },
    }),
  ],
  exports: [WinstonModule],
})
export class LoggingModule {}