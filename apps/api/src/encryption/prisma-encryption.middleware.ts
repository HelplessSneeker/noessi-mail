import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@noessi/database';
import { EncryptionService } from './encryption.service';

@Injectable()
export class PrismaEncryptionMiddleware {
  private readonly logger = new Logger(PrismaEncryptionMiddleware.name);

  // Define which fields should be encrypted for each model
  private readonly encryptionConfig = {
    User: ['email', 'name'],
    EmailAccount: ['email', 'accessToken', 'refreshToken'],
    Email: [
      'subject',
      'body',
      'bodyHtml',
      'fromAddress',
      'fromName',
      'toAddresses',
      'ccAddresses',
      'bccAddresses',
      'attachments',
    ],
  };

  constructor(private encryptionService: EncryptionService) {}

  applyMiddleware(prisma: PrismaClient): void {
    // Apply middleware for each model that needs encryption
    Object.keys(this.encryptionConfig).forEach((modelName) => {
      this.applyModelMiddleware(prisma, modelName);
    });

    this.logger.log('Applied encryption middleware to Prisma client');
  }

  private applyModelMiddleware(prisma: PrismaClient, modelName: string): void {
    const fieldsToEncrypt = this.encryptionConfig[modelName];
    if (!fieldsToEncrypt || fieldsToEncrypt.length === 0) {
      return;
    }

    // Convert model name to lowercase for Prisma client access
    const modelKey = modelName.charAt(0).toLowerCase() + modelName.slice(1);

    // Apply middleware for create operations
    prisma.$use(async (params, next) => {
      if (params.model === modelName) {
        // Encrypt data before create/update operations
        if (params.action === 'create' || params.action === 'update') {
          if (params.args?.data) {
            params.args.data = this.encryptionService.encryptObject(
              params.args.data,
              fieldsToEncrypt,
            );
          }
        }

        // Encrypt data for upsert operations
        if (params.action === 'upsert') {
          if (params.args?.create) {
            params.args.create = this.encryptionService.encryptObject(
              params.args.create,
              fieldsToEncrypt,
            );
          }
          if (params.args?.update) {
            params.args.update = this.encryptionService.encryptObject(
              params.args.update,
              fieldsToEncrypt,
            );
          }
        }

        // Encrypt data for updateMany operations
        if (params.action === 'updateMany') {
          if (params.args?.data) {
            params.args.data = this.encryptionService.encryptObject(
              params.args.data,
              fieldsToEncrypt,
            );
          }
        }

        // Execute the database operation
        const result = await next(params);

        // Decrypt data after read operations
        if (
          params.action === 'findUnique' ||
          params.action === 'findFirst' ||
          params.action === 'create' ||
          params.action === 'update' ||
          params.action === 'upsert'
        ) {
          if (result) {
            return this.encryptionService.decryptObject(result, fieldsToEncrypt);
          }
        }

        // Decrypt data for findMany operations
        if (params.action === 'findMany') {
          if (Array.isArray(result)) {
            return result.map((item) =>
              this.encryptionService.decryptObject(item, fieldsToEncrypt),
            );
          }
        }

        return result;
      }

      // For non-encrypted models, just pass through
      return next(params);
    });
  }

  /**
   * Manually encrypt a record (useful for data migration)
   */
  encryptRecord<T extends Record<string, any>>(
    modelName: string,
    record: T,
  ): T {
    const fieldsToEncrypt = this.encryptionConfig[modelName];
    if (!fieldsToEncrypt) {
      return record;
    }

    return this.encryptionService.encryptObject(record, fieldsToEncrypt);
  }

  /**
   * Manually decrypt a record (useful for debugging)
   */
  decryptRecord<T extends Record<string, any>>(
    modelName: string,
    record: T,
  ): T {
    const fieldsToDecrypt = this.encryptionConfig[modelName];
    if (!fieldsToDecrypt) {
      return record;
    }

    return this.encryptionService.decryptObject(record, fieldsToDecrypt);
  }

  /**
   * Get encryption configuration for a model
   */
  getEncryptionConfig(modelName: string): string[] {
    return this.encryptionConfig[modelName] || [];
  }
}