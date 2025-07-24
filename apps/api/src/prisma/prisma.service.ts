import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@noessi/database';
import { PrismaEncryptionMiddleware } from '../encryption/prisma-encryption.middleware';
import { EncryptionService } from '../encryption/encryption.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(
    private encryptionService: EncryptionService,
  ) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    
    // Apply encryption middleware
    // Temporarily disabled for testing
    // const encryptionMiddleware = new PrismaEncryptionMiddleware(this.encryptionService);
    // encryptionMiddleware.applyMiddleware(this);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
