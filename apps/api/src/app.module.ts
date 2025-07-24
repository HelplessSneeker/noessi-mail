import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { LoggingModule, LoggingInterceptor } from './logging';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { EmailAccountModule } from './email-account/email-account.module';
import { EncryptionModule } from './encryption/encryption.module';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { DemoModule } from './demo/demo.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    EncryptionModule,
    LoggingModule,
    PrismaModule,
    AuthModule,
    EmailAccountModule,
    DemoModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
