import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from './encryption.service';

@Injectable()
export class EncryptionMigrationUtil {
  private readonly logger = new Logger(EncryptionMigrationUtil.name);

  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  /**
   * Migrates existing unencrypted data to encrypted format
   * This should only be run once when implementing encryption on existing data
   */
  async migrateExistingData(): Promise<void> {
    this.logger.log('Starting encryption migration for existing data...');

    try {
      // Migrate Users
      await this.migrateUsers();
      
      // Migrate EmailAccounts
      await this.migrateEmailAccounts();
      
      // Migrate Emails (if any exist)
      await this.migrateEmails();

      this.logger.log('Encryption migration completed successfully');
    } catch (error) {
      this.logger.error('Encryption migration failed:', error);
      throw error;
    }
  }

  private async migrateUsers(): Promise<void> {
    this.logger.log('Migrating User records...');
    
    // Get all users with raw query to bypass middleware
    const users = await this.prisma.$queryRaw`SELECT * FROM users`;
    
    for (const user of users as any[]) {
      // Check if data is already encrypted
      if (this.isDataEncrypted(user.email) || this.isDataEncrypted(user.name)) {
        continue; // Skip already encrypted records
      }

      // Encrypt the data manually
      const encryptedData: any = {};
      
      if (user.email) {
        encryptedData.email = this.encryptionService.encrypt(user.email);
      }
      
      if (user.name) {
        encryptedData.name = this.encryptionService.encrypt(user.name);
      }

      // Update with raw query to bypass middleware
      await this.prisma.$executeRaw`
        UPDATE users 
        SET email = ${encryptedData.email}, name = ${encryptedData.name}
        WHERE id = ${user.id}
      `;
    }
    
    this.logger.log(`Migrated ${(users as any[]).length} User records`);
  }

  private async migrateEmailAccounts(): Promise<void> {
    this.logger.log('Migrating EmailAccount records...');
    
    const emailAccounts = await this.prisma.$queryRaw`SELECT * FROM email_accounts`;
    
    for (const account of emailAccounts as any[]) {
      // Check if data is already encrypted
      if (this.isDataEncrypted(account.email)) {
        continue; // Skip already encrypted records
      }

      // Encrypt the data manually
      const encryptedData: any = {};
      
      if (account.email) {
        encryptedData.email = this.encryptionService.encrypt(account.email);
      }
      
      if (account.accessToken) {
        encryptedData.accessToken = this.encryptionService.encrypt(account.accessToken);
      }
      
      if (account.refreshToken) {
        encryptedData.refreshToken = this.encryptionService.encrypt(account.refreshToken);
      }

      // Update with raw query to bypass middleware
      await this.prisma.$executeRaw`
        UPDATE email_accounts 
        SET 
          email = ${encryptedData.email},
          "accessToken" = ${encryptedData.accessToken || account.accessToken},
          "refreshToken" = ${encryptedData.refreshToken || account.refreshToken}
        WHERE id = ${account.id}
      `;
    }
    
    this.logger.log(`Migrated ${(emailAccounts as any[]).length} EmailAccount records`);
  }

  private async migrateEmails(): Promise<void> {
    this.logger.log('Migrating Email records...');
    
    const emails = await this.prisma.$queryRaw`SELECT * FROM emails`;
    
    for (const email of emails as any[]) {
      // Check if data is already encrypted
      if (this.isDataEncrypted(email.subject)) {
        continue; // Skip already encrypted records
      }

      // Encrypt the data manually
      const encryptedData: any = {};
      
      ['subject', 'body', 'bodyHtml', 'fromAddress', 'fromName'].forEach(field => {
        if (email[field]) {
          encryptedData[field] = this.encryptionService.encrypt(email[field]);
        }
      });

      // Handle array fields
      ['toAddresses', 'ccAddresses', 'bccAddresses'].forEach(field => {
        if (email[field] && Array.isArray(email[field])) {
          encryptedData[field] = email[field].map((addr: string) => 
            this.encryptionService.encrypt(addr)
          );
        }
      });

      // Handle JSON field
      if (email.attachments) {
        encryptedData.attachments = this.encryptionService.encrypt(
          JSON.stringify(email.attachments)
        );
      }

      // Update with raw query to bypass middleware
      await this.prisma.$executeRaw`
        UPDATE emails 
        SET 
          subject = ${encryptedData.subject || email.subject},
          body = ${encryptedData.body || email.body},
          "bodyHtml" = ${encryptedData.bodyHtml || email.bodyHtml},
          "fromAddress" = ${encryptedData.fromAddress || email.fromAddress},
          "fromName" = ${encryptedData.fromName || email.fromName},
          "toAddresses" = ${encryptedData.toAddresses || email.toAddresses},
          "ccAddresses" = ${encryptedData.ccAddresses || email.ccAddresses},
          "bccAddresses" = ${encryptedData.bccAddresses || email.bccAddresses},
          attachments = ${encryptedData.attachments || email.attachments}
        WHERE id = ${email.id}
      `;
    }
    
    this.logger.log(`Migrated ${(emails as any[]).length} Email records`);
  }

  private isDataEncrypted(data: string | null): boolean {
    if (!data || typeof data !== 'string') {
      return false;
    }
    
    // Check if data is in encrypted format (contains two colons for IV:encrypted:tag)
    return data.includes(':') && data.split(':').length === 3;
  }

  /**
   * Verifies that encryption is working by testing a round-trip
   */
  async verifyEncryption(): Promise<boolean> {
    try {
      const testData = 'test-encryption-verification';
      const encrypted = this.encryptionService.encrypt(testData);
      const decrypted = this.encryptionService.decrypt(encrypted);
      
      const isWorking = decrypted === testData;
      
      if (isWorking) {
        this.logger.log('Encryption verification successful');
      } else {
        this.logger.error('Encryption verification failed');
      }
      
      return isWorking;
    } catch (error) {
      this.logger.error('Encryption verification error:', error);
      return false;
    }
  }
}