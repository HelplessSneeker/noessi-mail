import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmailAccountDto, UpdateEmailAccountDto } from './dto/email-account.dto';
import { ImapService } from '../imap/imap.service';
import { EnhancedImapSyncOptions, SyncStrategy } from '../imap/dto/imap.dto';
import { ProgressTrackerService } from './progress-tracker.service';

@Injectable()
export class EmailAccountService {
  constructor(
    private prisma: PrismaService,
    private imapService: ImapService,
    private progressTracker: ProgressTrackerService,
  ) {}

  async findAllByUserId(userId: string) {
    return this.prisma.emailAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const emailAccount = await this.prisma.emailAccount.findFirst({
      where: { id, userId },
    });

    if (!emailAccount) {
      throw new NotFoundException('Email account not found');
    }

    return emailAccount;
  }

  async create(userId: string, createEmailAccountDto: CreateEmailAccountDto) {
    // Check if email account already exists for this user
    const existingAccount = await this.prisma.emailAccount.findFirst({
      where: {
        email: createEmailAccountDto.email,
        userId,
      },
    });

    if (existingAccount) {
      throw new ConflictException('Email account already exists');
    }

    return this.prisma.emailAccount.create({
      data: {
        ...createEmailAccountDto,
        userId,
      },
    });
  }

  async update(
    id: string,
    userId: string,
    updateEmailAccountDto: UpdateEmailAccountDto,
  ) {
    // Check if the email account exists and belongs to the user
    await this.findOne(id, userId);

    // If updating email, check for conflicts
    if (updateEmailAccountDto.email) {
      const existingAccount = await this.prisma.emailAccount.findFirst({
        where: {
          email: updateEmailAccountDto.email,
          userId,
          id: { not: id },
        },
      });

      if (existingAccount) {
        throw new ConflictException('Email account with this email already exists');
      }
    }

    return this.prisma.emailAccount.update({
      where: { id },
      data: updateEmailAccountDto,
    });
  }

  async remove(id: string, userId: string) {
    // Check if the email account exists and belongs to the user
    await this.findOne(id, userId);

    return this.prisma.emailAccount.delete({
      where: { id },
    });
  }

  /**
   * Test IMAP connection for an existing email account
   */
  async testImapConnection(id: string, userId: string) {
    const emailAccount = await this.findOne(id, userId);

    if (!emailAccount.imapHost || !emailAccount.password) {
      throw new BadRequestException('Email account is not configured for IMAP');
    }

    try {
      const result = await this.imapService.testConnection({
        host: emailAccount.imapHost,
        port: emailAccount.imapPort || 993,
        user: emailAccount.email,
        password: emailAccount.password, // Will be decrypted by Prisma middleware
        security: emailAccount.imapSecurity as any || 'tls',
      });

      return {
        ...result,
        accountId: id,
        email: emailAccount.email,
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
        accountId: id,
        email: emailAccount.email,
      };
    }
  }

  /**
   * Get email statistics for an account
   */
  async getEmailStats(id: string, userId: string) {
    const emailAccount = await this.findOne(id, userId);

    const stats = await this.prisma.email.groupBy({
      by: ['folderName', 'isRead', 'isStarred', 'isDeleted'],
      where: {
        emailAccountId: id,
        userId: userId,
      },
      _count: {
        id: true,
      },
    });

    // Calculate folder-specific statistics
    const folderStats: Record<string, any> = {};
    let totalEmails = 0;
    let unreadEmails = 0;
    let starredEmails = 0;

    for (const stat of stats) {
      const folder = stat.folderName || 'INBOX';
      const count = stat._count.id;
      
      if (!folderStats[folder]) {
        folderStats[folder] = { total: 0, unread: 0, starred: 0 };
      }
      
      folderStats[folder].total += count;
      totalEmails += count;
      
      if (!stat.isRead) {
        folderStats[folder].unread += count;
        unreadEmails += count;
      }
      
      if (stat.isStarred) {
        folderStats[folder].starred += count;
        starredEmails += count;
      }
    }

    return {
      accountId: id,
      email: emailAccount.email,
      totalEmails,
      unreadEmails,
      starredEmails,
      folderStats,
      lastUpdated: new Date(),
    };
  }

  /**
   * Trigger full re-sync with ALL emails (no limits) - runs in background with progress tracking
   */
  async triggerFullResync(id: string, userId: string, syncOptions: EnhancedImapSyncOptions = {}) {
    const emailAccount = await this.findOne(id, userId);

    if (!emailAccount.imapHost || !emailAccount.password) {
      throw new BadRequestException('Email account is not configured for IMAP');
    }

    // Check if sync is already in progress
    if (this.progressTracker.isActive(id)) {
      return {
        success: false,
        message: 'Sync already in progress',
        accountId: id,
        email: emailAccount.email,
        inProgress: true,
      };
    }

    // Start progress tracking
    this.progressTracker.startProgress(id);

    // Set options to sync ALL emails (no limit)
    const fullSyncOptions: EnhancedImapSyncOptions = {
      includeSpam: true,
      includeInbox: true,
      limit: null, // NO LIMIT - SYNC ALL EMAILS
      strategy: SyncStrategy.SEQUENTIAL,
      continueOnError: true,
      maxConcurrency: 2,
      fetchBody: true,
      fetchAttachments: false,
      ...syncOptions,
    };

    // Start sync in background
    this.performBackgroundSync(id, userId, fullSyncOptions, false);

    return {
      success: true,
      message: 'Full re-sync started in background. Check progress with GET /email-accounts/:id/sync-progress',
      accountId: id,
      email: emailAccount.email,
      inProgress: true,
    };
  }

  /**
   * Clear all emails for account and trigger fresh sync - runs in background with progress tracking
   */
  async clearAndResync(id: string, userId: string, syncOptions: EnhancedImapSyncOptions = {}) {
    const emailAccount = await this.findOne(id, userId);

    if (!emailAccount.imapHost || !emailAccount.password) {
      throw new BadRequestException('Email account is not configured for IMAP');
    }

    // Check if sync is already in progress
    if (this.progressTracker.isActive(id)) {
      return {
        success: false,
        message: 'Sync already in progress',
        accountId: id,
        email: emailAccount.email,
        inProgress: true,
      };
    }

    // Start progress tracking
    this.progressTracker.startProgress(id);
    this.progressTracker.updateProgress(id, {
      message: 'Clearing existing emails...',
      status: 'syncing',
    });

    try {
      // Clear all existing emails for this account
      const deleteResult = await this.prisma.email.deleteMany({
        where: {
          emailAccountId: id,
          userId: userId,
        },
      });

      this.progressTracker.updateProgress(id, {
        message: `Cleared ${deleteResult.count} emails. Starting fresh sync...`,
      });

      // Trigger fresh sync with NO LIMITS - sync ALL emails
      const fullSyncOptions: EnhancedImapSyncOptions = {
        includeSpam: true,
        includeInbox: true,
        limit: null, // NO LIMIT - SYNC ALL EMAILS AFTER CLEARING
        strategy: SyncStrategy.SEQUENTIAL,
        continueOnError: true,
        maxConcurrency: 2,
        fetchBody: true,
        fetchAttachments: false,
        ...syncOptions,
      };

      // Start sync in background
      this.performBackgroundSync(id, userId, fullSyncOptions, true, deleteResult.count);

      return {
        success: true,
        message: `Cleared ${deleteResult.count} emails. Fresh sync started in background. Check progress with GET /email-accounts/:id/sync-progress`,
        accountId: id,
        email: emailAccount.email,
        deletedEmails: deleteResult.count,
        inProgress: true,
      };
    } catch (error) {
      this.progressTracker.errorProgress(id, error.message);
      return {
        success: false,
        message: `Clear and re-sync failed: ${error.message}`,
        accountId: id,
        email: emailAccount.email,
        error: error.message,
      };
    }
  }

  /**
   * Unlimited sync for power users - syncs ALL emails from ALL folders
   * This is for users who explicitly want complete mailbox synchronization
   */
  async unlimitedSync(id: string, userId: string, syncOptions: EnhancedImapSyncOptions = {}) {
    const emailAccount = await this.findOne(id, userId);

    if (!emailAccount.imapHost || !emailAccount.password) {
      throw new BadRequestException('Email account is not configured for IMAP');
    }

    // Set unlimited sync options
    const unlimitedSyncOptions: EnhancedImapSyncOptions = {
      includeSpam: true,
      includeInbox: true,
      limit: null, // Truly unlimited
      strategy: SyncStrategy.SEQUENTIAL, // Sequential for reliability with large datasets
      continueOnError: true,
      maxConcurrency: 1, // Single thread for stability
      fetchBody: true,
      fetchAttachments: false,
      folders: [], // Empty array means auto-detect ALL folders
      ...syncOptions,
    };

    try {
      const result = await this.imapService.syncMultipleFolders(id, userId, unlimitedSyncOptions);
      
      return {
        success: true,
        message: 'Unlimited sync completed successfully',
        accountId: id,
        email: emailAccount.email,
        syncResult: result,
        warning: `Synced ${result.syncedMessages} emails from ${result.syncedFolders.length} folders. This includes all available folders.`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Unlimited sync failed: ${error.message}`,
        accountId: id,
        email: emailAccount.email,
        error: error.message,
      };
    }
  }

  /**
   * Get sync progress for an account
   */
  getSyncProgress(id: string) {
    return this.progressTracker.getProgress(id);
  }

  /**
   * Perform background sync with progress tracking
   */
  private async performBackgroundSync(
    accountId: string, 
    userId: string, 
    syncOptions: EnhancedImapSyncOptions, 
    wasClearAndResync: boolean = false,
    deletedCount: number = 0
  ) {
    try {
      // Set up progress callback for real-time updates
      const progressCallback = (update: Partial<any>) => {
        this.progressTracker.updateProgress(accountId, {
          status: 'syncing',
          currentFolder: update.currentFolder || 'Processing...',
          foldersProcessed: update.foldersProcessed || 0,
          totalFolders: update.totalFolders || 0,
          emailsProcessed: update.emailsProcessed || 0,
          totalEmails: update.totalEmails || 0,
          message: update.message || 'Syncing emails...',
        });
      };

      this.progressTracker.updateProgress(accountId, {
        status: 'syncing',
        message: 'Starting email synchronization...',
      });

      // Pass progress callback to sync service
      const result = await this.imapService.syncMultipleFoldersWithProgress(
        accountId, 
        userId, 
        syncOptions, 
        progressCallback
      );
      
      const message = wasClearAndResync 
        ? `Clear and re-sync completed: Deleted ${deletedCount} old emails, synced ${result.syncedMessages} new emails from ${result.syncedFolders.length} folders`
        : `Full re-sync completed: ${result.syncedMessages} emails from ${result.syncedFolders.length} folders`;

      this.progressTracker.completeProgress(accountId, message);
      
    } catch (error) {
      this.progressTracker.errorProgress(accountId, error.message);
    }
  }
}