import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly key: Buffer;

  constructor(private configService: ConfigService) {
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    // Validate key format (should be 64 hex characters for 32 bytes)
    if (!/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
      throw new Error('ENCRYPTION_KEY must be a 64-character hexadecimal string (32 bytes)');
    }

    this.key = Buffer.from(encryptionKey, 'hex');
    this.logger.log('Encryption service initialized with AES-256-GCM');
  }

  /**
   * Encrypts a plaintext string using AES-256-GCM
   * @param plaintext The string to encrypt
   * @returns Encrypted string in format: iv:encrypted:tag (all base64 encoded)
   */
  encrypt(plaintext: string): string {
    if (!plaintext || typeof plaintext !== 'string') {
      return plaintext; // Return as-is for null/undefined/non-string values
    }

    try {
      // Generate random IV for each encryption
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher
      const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
      
      // Set additional authenticated data
      const aad = Buffer.from('noessi-mail-encryption', 'utf8');
      cipher.setAAD(aad);
      
      // Encrypt the data
      let encrypted = cipher.update(plaintext, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      // Get the authentication tag
      const tag = cipher.getAuthTag();
      
      // Return combined format: iv:encrypted:tag
      return `${iv.toString('base64')}:${encrypted.toString('base64')}:${tag.toString('base64')}`;
    } catch (error) {
      this.logger.error(`Encryption failed: ${error.message}`, error.stack);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypts an encrypted string using AES-256-GCM
   * @param encryptedData Encrypted string in format: iv:encrypted:tag
   * @returns Decrypted plaintext string
   */
  decrypt(encryptedData: string): string {
    if (!encryptedData || typeof encryptedData !== 'string') {
      return encryptedData; // Return as-is for null/undefined/non-string values
    }

    // Check if data is in encrypted format
    if (!encryptedData.includes(':') || encryptedData.split(':').length !== 3) {
      // Data is not encrypted, return as-is (for backward compatibility)
      return encryptedData;
    }

    try {
      // Parse the encrypted data
      const [ivBase64, encryptedBase64, tagBase64] = encryptedData.split(':');
      
      const iv = Buffer.from(ivBase64, 'base64');
      const encrypted = Buffer.from(encryptedBase64, 'base64');
      const tag = Buffer.from(tagBase64, 'base64');
      
      // Create decipher  
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
      
      // Set additional authenticated data and auth tag
      const aad = Buffer.from('noessi-mail-encryption', 'utf8');
      decipher.setAAD(aad);
      decipher.setAuthTag(tag);
      
      // Decrypt the data
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error(`Decryption failed: ${error.message}`, error.stack);
      // Return original data if decryption fails (for backward compatibility)
      return encryptedData;
    }
  }

  /**
   * Encrypts an object by encrypting specified string fields
   * @param obj Object to encrypt
   * @param fieldsToEncrypt Array of field names to encrypt
   * @returns Object with encrypted fields
   */
  encryptObject<T extends Record<string, any>>(
    obj: T,
    fieldsToEncrypt: (keyof T)[],
  ): T {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const result = { ...obj };

    for (const field of fieldsToEncrypt) {
      if (result[field] !== null && result[field] !== undefined) {
        if (typeof result[field] === 'string') {
          result[field] = this.encrypt(result[field] as string) as T[keyof T];
        } else if (Array.isArray(result[field])) {
          // Handle string arrays (like email addresses)
          result[field] = (result[field] as string[]).map(item => 
            typeof item === 'string' ? this.encrypt(item) : item
          ) as T[keyof T];
        } else if (typeof result[field] === 'object') {
          // Handle JSON objects (like attachments)
          result[field] = this.encrypt(JSON.stringify(result[field])) as T[keyof T];
        }
      }
    }

    return result;
  }

  /**
   * Decrypts an object by decrypting specified string fields
   * @param obj Object to decrypt
   * @param fieldsToDecrypt Array of field names to decrypt
   * @returns Object with decrypted fields
   */
  decryptObject<T extends Record<string, any>>(
    obj: T,
    fieldsToDecrypt: (keyof T)[],
  ): T {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const result = { ...obj };

    for (const field of fieldsToDecrypt) {
      if (result[field] !== null && result[field] !== undefined) {
        if (typeof result[field] === 'string') {
          result[field] = this.decrypt(result[field] as string) as T[keyof T];
        } else if (Array.isArray(result[field])) {
          // Handle string arrays (like email addresses)
          result[field] = (result[field] as string[]).map(item => 
            typeof item === 'string' ? this.decrypt(item) : item
          ) as T[keyof T];
        } else if (typeof result[field] === 'object') {
          // Handle JSON objects (like attachments) - they were stored as encrypted strings
          try {
            const decryptedString = this.decrypt(result[field] as string);
            result[field] = JSON.parse(decryptedString) as T[keyof T];
          } catch (error) {
            this.logger.warn(`Failed to parse JSON for field ${String(field)}: ${error.message}`);
            // Keep the decrypted string if JSON parsing fails
            result[field] = this.decrypt(result[field] as string) as T[keyof T];
          }
        }
      }
    }

    return result;
  }

  /**
   * Generates a new encryption key (for setup purposes)
   * @returns 64-character hexadecimal string representing a 32-byte key
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}