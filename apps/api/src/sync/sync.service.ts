import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { SyncGateway, SyncProgress } from './sync.gateway';
import { ImapService } from '../imap/imap.service';
import { EmailAccountService } from '../email-account/email-account.service';
import { PrismaService } from '../prisma/prisma.service';

export interface KeepAliveSyncOptions {
  emailAccountId: string;
  userId: string;
  clearExisting?: boolean;
  includeSpam?: boolean;
  batchSize?: number;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private activeSessions = new Map<string, boolean>();

  constructor(
    private syncGateway: SyncGateway,
    private imapService: ImapService,
    private emailAccountService: EmailAccountService,
    private prisma: PrismaService,
  ) {}

  /**
   * Start a keep-alive sync session with real-time progress updates
   */
  async startKeepAliveSync(options: KeepAliveSyncOptions): Promise<{ sessionId: string }> {
    const sessionId = uuidv4();
    this.activeSessions.set(sessionId, true);

    this.logger.log(`Starting keep-alive sync session ${sessionId} for account ${options.emailAccountId}`);

    // Start the sync in the background
    this.performKeepAliveSync(sessionId, options).catch(error => {
      this.logger.error(`Keep-alive sync session ${sessionId} failed:`, error);
      this.syncGateway.sendError(sessionId, {
        sessionId,
        error: error.message,
        timestamp: new Date(),
      });
    });

    return { sessionId };
  }

  /**
   * Cancel an active sync session
   */
  async cancelSync(sessionId: string): Promise<void> {
    this.activeSessions.set(sessionId, false);
    this.logger.log(`Cancelled sync session ${sessionId}`);
  }

  private async performKeepAliveSync(sessionId: string, options: KeepAliveSyncOptions) {
    try {
      // Get email account
      const emailAccount = await this.emailAccountService.findOne(options.emailAccountId, options.userId);
      
      // Send initial progress
      await this.sendProgress(sessionId, {
        sessionId,
        emailAccountId: options.emailAccountId,
        currentFolder: 'Initializing...',
        foldersProcessed: 0,
        totalFolders: 0,
        emailsProcessed: 0,
        totalEmails: 0,
        currentFolderProgress: 0,
        overallProgress: 0,
        status: 'starting',
        message: 'Connecting to email server...',
      });

      if (!this.isSessionActive(sessionId)) return;

      // Clear existing emails if requested
      if (options.clearExisting) {
        await this.sendProgress(sessionId, {
          sessionId,
          emailAccountId: options.emailAccountId,
          currentFolder: 'Cleanup',
          foldersProcessed: 0,
          totalFolders: 0,
          emailsProcessed: 0,
          totalEmails: 0,
          currentFolderProgress: 0,
          overallProgress: 5,
          status: 'syncing',
          message: 'Clearing existing emails...',
        });

        await this.prisma.email.deleteMany({
          where: {
            emailAccountId: options.emailAccountId,
            userId: options.userId,
          },
        });
      }

      if (!this.isSessionActive(sessionId)) return;

      // Get IMAP connection
      const connection = await this.imapService.getConnection(options.emailAccountId, options.userId);
      
      // Get all folders
      const allFolders = await this.imapService.getImapFolders(connection);
      
      // Filter folders to sync ALL folders (complete mailbox sync)
      const foldersToSync = allFolders.map(f => f.name);
      
      await this.sendProgress(sessionId, {
        sessionId,
        emailAccountId: options.emailAccountId,
        currentFolder: 'Planning',
        foldersProcessed: 0,
        totalFolders: foldersToSync.length,
        emailsProcessed: 0,
        totalEmails: 0,
        currentFolderProgress: 0,
        overallProgress: 10,
        status: 'syncing',
        message: `Found ${foldersToSync.length} folders to sync: ${foldersToSync.join(', ')}`,
      });

      if (!this.isSessionActive(sessionId)) return;

      // Calculate total emails across all folders
      let totalEmails = 0;
      const folderEmailCounts = new Map<string, number>();
      
      for (const folderName of foldersToSync) {
        if (!this.isSessionActive(sessionId)) return;
        
        try {
          const count = await this.imapService.getFolderMessageCount(connection, folderName);
          folderEmailCounts.set(folderName, count);
          totalEmails += count;
        } catch (error) {
          this.logger.warn(`Failed to get message count for folder ${folderName}: ${error.message}`);
          folderEmailCounts.set(folderName, 0);
        }
      }

      // Sync each folder
      let emailsProcessed = 0;
      let foldersProcessed = 0;
      const batchSize = options.batchSize || 50;

      for (const folderName of foldersToSync) {
        if (!this.isSessionActive(sessionId)) return;

        const folderEmailCount = folderEmailCounts.get(folderName) || 0;
        
        if (folderEmailCount === 0) {
          foldersProcessed++;
          continue;
        }

        await this.sendProgress(sessionId, {
          sessionId,
          emailAccountId: options.emailAccountId,
          currentFolder: folderName,
          foldersProcessed,
          totalFolders: foldersToSync.length,
          emailsProcessed,
          totalEmails,
          currentFolderProgress: 0,
          overallProgress: Math.round((emailsProcessed / totalEmails) * 90) + 10,
          status: 'syncing',
          message: `Syncing folder: ${folderName} (${folderEmailCount} emails)`,
        });

        // Sync folder in batches to avoid memory issues and provide granular progress
        let folderEmailsProcessed = 0;
        let offset = 0;

        while (folderEmailsProcessed < folderEmailCount && this.isSessionActive(sessionId)) {
          const remaining = folderEmailCount - folderEmailsProcessed;
          const currentBatchSize = Math.min(batchSize, remaining);

          try {
            // Sync batch of emails
            const syncResult = await this.imapService.syncEmails(options.emailAccountId, options.userId, {
              folder: folderName,
              limit: currentBatchSize,
              sinceUid: offset + 1,
              fetchBody: true,
              fetchAttachments: false,
              markSeen: false,
            });

            folderEmailsProcessed += syncResult.syncedCount;
            emailsProcessed += syncResult.syncedCount;

            // Update progress
            const currentFolderProgress = Math.round((folderEmailsProcessed / folderEmailCount) * 100);
            const overallProgress = Math.round((emailsProcessed / totalEmails) * 90) + 10;

            await this.sendProgress(sessionId, {
              sessionId,
              emailAccountId: options.emailAccountId,
              currentFolder: folderName,
              foldersProcessed,
              totalFolders: foldersToSync.length,
              emailsProcessed,
              totalEmails,
              currentFolderProgress,
              overallProgress,
              status: 'syncing',
              message: `Syncing ${folderName}: ${folderEmailsProcessed}/${folderEmailCount} emails`,
            });

            offset += currentBatchSize;

            // Small delay to prevent overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100));

          } catch (error) {
            this.logger.error(`Error syncing batch in folder ${folderName}:`, error);
            // Continue with next batch on error
            offset += currentBatchSize;
            folderEmailsProcessed += currentBatchSize; // Skip this batch
          }
        }

        foldersProcessed++;
      }

      if (!this.isSessionActive(sessionId)) return;

      // Send completion
      await this.sendProgress(sessionId, {
        sessionId,
        emailAccountId: options.emailAccountId,
        currentFolder: 'Completed',
        foldersProcessed,
        totalFolders: foldersToSync.length,
        emailsProcessed,
        totalEmails,
        currentFolderProgress: 100,
        overallProgress: 100,
        status: 'completed',
        message: `Successfully synced ${emailsProcessed} emails from ${foldersProcessed} folders`,
      });

      this.syncGateway.sendCompletion(sessionId, {
        sessionId,
        emailAccountId: options.emailAccountId,
        totalEmailsSynced: emailsProcessed,
        totalFolders: foldersProcessed,
        success: true,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error(`Keep-alive sync error for session ${sessionId}:`, error);
      
      if (this.isSessionActive(sessionId)) {
        await this.sendProgress(sessionId, {
          sessionId,
          emailAccountId: options.emailAccountId,
          currentFolder: 'Error',
          foldersProcessed: 0,
          totalFolders: 0,
          emailsProcessed: 0,
          totalEmails: 0,
          currentFolderProgress: 0,
          overallProgress: 0,
          status: 'error',
          message: `Sync failed: ${error.message}`,
          errors: [error.message],
        });
      }

      throw error;
    } finally {
      this.activeSessions.delete(sessionId);
    }
  }

  private isSessionActive(sessionId: string): boolean {
    return this.activeSessions.get(sessionId) === true;
  }

  private async sendProgress(sessionId: string, progress: SyncProgress) {
    this.syncGateway.sendProgress(sessionId, progress);
    
    // Small delay to ensure WebSocket message is sent
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}