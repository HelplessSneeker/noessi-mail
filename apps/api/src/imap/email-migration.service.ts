import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SmartFolderMapperService } from './smart-folder-mapper.service';

@Injectable()
export class EmailMigrationService {
  private readonly logger = new Logger(EmailMigrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly smartFolderMapper: SmartFolderMapperService,
  ) {}

  /**
   * Migrates all existing emails to use standardized folder names
   * This is a one-time migration utility
   */
  async migrateExistingEmails(): Promise<{
    totalEmails: number;
    migrated: number;
    skipped: number;
    errors: number;
    folderMappings: { [key: string]: string };
  }> {
    this.logger.log('Starting email folder migration...');
    
    const result = {
      totalEmails: 0,
      migrated: 0,
      skipped: 0,
      errors: 0,
      folderMappings: {} as { [key: string]: string },
    };

    try {
      // Get all emails with their current folder names
      const emails = await this.prisma.email.findMany({
        select: {
          id: true,
          folderName: true,
          fromAddress: true,
          toAddresses: true,
        },
      });

      result.totalEmails = emails.length;
      this.logger.log(`Found ${result.totalEmails} emails to process`);

      // Process emails in batches to avoid memory issues
      const batchSize = 100;
      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        
        for (const email of batch) {
          try {
            const currentFolder = email.folderName || 'INBOX';
            
            // Check if already using standardized folder name
            if (['inbox', 'sent', 'deleted', 'spam'].includes(currentFolder.toLowerCase())) {
              result.skipped++;
              continue;
            }

            // Map to standardized folder
            const folderMapping = this.smartFolderMapper.mapToStandardFolder(
              currentFolder,
              email.fromAddress,
              email.toAddresses
            );

            // Track folder mappings for reporting
            if (!result.folderMappings[currentFolder]) {
              result.folderMappings[currentFolder] = folderMapping.standardFolder;
            }

            // Update email with standardized folder name
            await this.prisma.email.update({
              where: { id: email.id },
              data: { folderName: folderMapping.standardFolder },
            });

            result.migrated++;

            // Log low confidence mappings
            if (folderMapping.confidence < 0.8) {
              this.logger.warn(`Low confidence migration: "${currentFolder}" -> "${folderMapping.standardFolder}" (${folderMapping.confidence.toFixed(2)}) - ${folderMapping.reason}`);
            }

          } catch (error) {
            this.logger.error(`Failed to migrate email ${email.id}: ${error.message}`);
            result.errors++;
          }
        }

        // Log progress
        const processed = Math.min(i + batchSize, emails.length);
        this.logger.log(`Processed ${processed}/${emails.length} emails (${Math.round(processed / emails.length * 100)}%)`);
      }

      this.logger.log(`Migration completed: ${result.migrated} migrated, ${result.skipped} skipped, ${result.errors} errors`);
      this.logger.log(`Folder mappings: ${JSON.stringify(result.folderMappings, null, 2)}`);

      return result;
    } catch (error) {
      this.logger.error(`Migration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Preview migration without making changes
   */
  async previewMigration(): Promise<{
    totalEmails: number;
    folderAnalysis: {
      originalFolder: string;
      standardFolder: string;
      confidence: number;
      count: number;
      reason: string;
    }[];
  }> {
    this.logger.log('Starting migration preview...');

    // Get unique folder names and their counts
    const folderCounts = await this.prisma.email.groupBy({
      by: ['folderName'],
      _count: { id: true },
    });

    const totalEmails = folderCounts.reduce((sum, item) => sum + item._count.id, 0);

    const folderAnalysis = folderCounts.map(item => {
      const originalFolder = item.folderName || 'INBOX';
      const mapping = this.smartFolderMapper.mapToStandardFolder(originalFolder);
      
      return {
        originalFolder,
        standardFolder: mapping.standardFolder,
        confidence: mapping.confidence,
        count: item._count.id,
        reason: mapping.reason,
      };
    });

    this.logger.log(`Preview analysis: ${folderAnalysis.length} unique folders, ${totalEmails} total emails`);
    
    return {
      totalEmails,
      folderAnalysis,
    };
  }
}