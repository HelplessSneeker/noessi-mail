import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as Imap from 'node-imap';
import { ImapConnectionService } from './imap-connection.service';
import { EmailParserService, ParsedEmailData } from './email-parser.service';
import { FolderDetectionService } from './folder-detection.service';
import { SmartFolderMapperService } from './smart-folder-mapper.service';
import { ImapConnectionConfig, ImapSecurity, ImapSyncOptions, ImapFolderInfo, TestConnectionDto, EnhancedImapSyncOptions, MultiSyncResult, SyncStrategy } from './dto/imap.dto';

@Injectable()
export class ImapService {
  private readonly logger = new Logger(ImapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly imapConnection: ImapConnectionService,
    private readonly emailParser: EmailParserService,
    private readonly folderDetection: FolderDetectionService,
    private readonly smartFolderMapper: SmartFolderMapperService,
  ) {}

  /**
   * Tests IMAP connection with provided credentials
   */
  async testConnection(testDto: TestConnectionDto): Promise<{ success: boolean; message: string }> {
    try {
      const config: ImapConnectionConfig = {
        host: testDto.host,
        port: testDto.port,
        user: testDto.user,
        password: testDto.password,
        security: testDto.security,
        keepAlive: false, // Don't keep test connections alive
        connTimeout: 10000,
        authTimeout: 5000,
      };

      await this.imapConnection.testConnection(config);
      
      return {
        success: true,
        message: 'IMAP connection successful',
      };
    } catch (error) {
      this.logger.error('IMAP connection test failed:', error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Syncs emails from IMAP server for a specific email account
   */
  async syncEmails(emailAccountId: string, userId: string, options: ImapSyncOptions = {}): Promise<{ syncedCount: number; totalMessages: number }> {
    try {
      // Get email account with IMAP credentials
      const emailAccount = await this.prisma.emailAccount.findFirst({
        where: { id: emailAccountId, userId },
      });

      if (!emailAccount) {
        throw new BadRequestException('Email account not found');
      }

      if (!emailAccount.imapHost || !emailAccount.password) {
        throw new BadRequestException('Email account is not configured for IMAP');
      }

      // Create IMAP connection config
      const config: ImapConnectionConfig = {
        host: emailAccount.imapHost,
        port: emailAccount.imapPort || 993,
        user: emailAccount.email,
        password: emailAccount.password, // This will be decrypted by Prisma middleware
        security: (emailAccount.imapSecurity as ImapSecurity) || ImapSecurity.TLS,
      };

      // Get IMAP connection
      const connection = await this.imapConnection.getConnection(emailAccountId, config);
      
      // Sync emails from specified folder
      const result = await this.syncFolderEmails(connection, emailAccountId, userId, options);
      
      this.logger.log(`Email sync completed for account ${emailAccountId}: ${result.syncedCount}/${result.totalMessages} messages`);
      
      return result;
    } catch (error) {
      this.logger.error(`Email sync failed for account ${emailAccountId}:`, error.message);
      throw new InternalServerErrorException(`Email sync failed: ${error.message}`);
    }
  }

  /**
   * Gets list of folders from IMAP server
   */
  async getFolders(emailAccountId: string, userId: string): Promise<ImapFolderInfo[]> {
    try {
      const emailAccount = await this.prisma.emailAccount.findFirst({
        where: { id: emailAccountId, userId },
      });

      if (!emailAccount || !emailAccount.imapHost || !emailAccount.password) {
        throw new BadRequestException('Email account not found or not configured for IMAP');
      }

      const config: ImapConnectionConfig = {
        host: emailAccount.imapHost,
        port: emailAccount.imapPort || 993,
        user: emailAccount.email,
        password: emailAccount.password,
        security: (emailAccount.imapSecurity as ImapSecurity) || ImapSecurity.TLS,
      };

      const connection = await this.imapConnection.getConnection(emailAccountId, config);
      
      return await this.getImapFolders(connection);
    } catch (error) {
      this.logger.error(`Failed to get folders for account ${emailAccountId}:`, error.message);
      throw new InternalServerErrorException(`Failed to get folders: ${error.message}`);
    }
  }

  /**
   * Syncs emails from a specific folder
   */
  private async syncFolderEmails(
    connection: Imap,
    emailAccountId: string,
    userId: string,
    options: ImapSyncOptions,
  ): Promise<{ syncedCount: number; totalMessages: number }> {
    return new Promise((resolve, reject) => {
      const folder = options.folder || 'INBOX';
      
      connection.openBox(folder, true, (err, box) => {
        if (err) {
          reject(new BadRequestException(`Failed to open folder ${folder}: ${err.message}`));
          return;
        }

        if (box.messages.total === 0) {
          resolve({ syncedCount: 0, totalMessages: 0 });
          return;
        }

        this.logger.log(`Opened folder ${folder}: ${box.messages.total} total messages`);

        // Determine message range to fetch - SYNC ALL EMAILS
        const totalMessages = box.messages.total;
        const limit = options.limit;
        
        let fetchRange: string;
        if (limit && limit > 0) {
          // If limit specified, get the most recent emails
          const startSeq = Math.max(1, totalMessages - limit + 1);
          const endSeq = totalMessages;
          fetchRange = `${startSeq}:${endSeq}`;
          this.logger.log(`Fetching messages ${fetchRange} from folder ${folder} (limited to ${limit})`);
        } else {
          // NO LIMIT - FETCH ALL EMAILS
          fetchRange = `1:${totalMessages}`;
          this.logger.log(`Fetching ALL messages ${fetchRange} from folder ${folder} (${totalMessages} total emails)`);
        }

        // Fetch message headers and UIDs
        const fetch = connection.seq.fetch(fetchRange, {
          bodies: options.fetchBody ? '' : 'HEADER',
          struct: true,
          envelope: true,
        });

        let syncedCount = 0;
        const messagePromises: Promise<void>[] = [];

        fetch.on('message', (msg, seqno) => {
          const messagePromise = this.processImapMessage(msg, seqno, emailAccountId, userId, options)
            .then(() => {
              syncedCount++;
              this.logger.debug(`Successfully processed message ${seqno}`);
            })
            .catch((error) => {
              this.logger.error(`Failed to process message ${seqno}:`, error.message);
              // Don't increment syncedCount for failed messages
            });
          messagePromises.push(messagePromise);
        });

        fetch.once('error', (err) => {
          this.logger.error(`Fetch error in folder ${folder}:`, err.message);
          reject(new InternalServerErrorException(`Fetch error: ${err.message}`));
        });

        fetch.once('end', async () => {
          try {
            // Wait for all messages to be processed
            await Promise.allSettled(messagePromises);
            
            this.logger.log(`Finished fetching from folder ${folder}: ${syncedCount} messages processed`);
            resolve({ syncedCount, totalMessages });
          } catch (error) {
            reject(error);
          }
        });
      });
    });
  }

  /**
   * Processes a single IMAP message
   */
  private async processImapMessage(
    msg: any,
    seqno: number,
    emailAccountId: string,
    userId: string,
    options: ImapSyncOptions,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let attrs: any;
      let body = Buffer.alloc(0);

      msg.on('body', (stream, info) => {
        stream.on('data', (chunk) => {
          body = Buffer.concat([body, chunk]);
        });
      });

      msg.once('attributes', (attribs) => {
        attrs = attribs;
      });

      msg.once('end', async () => {
        try {
          if (!attrs) {
            reject(new Error(`No attributes received for message ${seqno}`));
            return;
          }

          // Parse message info from IMAP attributes
          const messageInfo = this.emailParser.parseMessageInfo(attrs, attrs.uid);

          // Check if email already exists
          const existingEmail = await this.prisma.email.findUnique({
            where: { messageId: messageInfo.messageId },
          });

          if (existingEmail) {
            this.logger.debug(`Email ${messageInfo.messageId} already exists, skipping`);
            resolve();
            return;
          }

          // Parse email content if body was fetched
          let parsedEmail: ParsedEmailData;
          if (options.fetchBody && body.length > 0) {
            parsedEmail = await this.emailParser.parseEmail(body, messageInfo);
          } else {
            // Create basic email data from headers only
            parsedEmail = {
              messageId: messageInfo.messageId,
              subject: messageInfo.subject,
              body: undefined,
              bodyHtml: undefined,
              fromAddress: messageInfo.from[0] || 'unknown@unknown.com',
              fromName: undefined,
              toAddresses: messageInfo.to,
              ccAddresses: messageInfo.cc || [],
              bccAddresses: messageInfo.bcc || [],
              sentAt: messageInfo.date,
              receivedAt: messageInfo.date,
              attachments: [],
              size: messageInfo.size,
              inReplyTo: undefined,
              references: [],
              threadId: undefined,
            };
          }

          // Save email to database with ORIGINAL folder name
          // Folder mapping will be handled in the frontend for display purposes
          await this.prisma.email.upsert({
            where: {
              messageId: parsedEmail.messageId,
            },
            update: {
              // Update fields that might change (flags, folder, etc.)
              isRead: messageInfo.flags.includes('\\Seen'),
              isStarred: messageInfo.flags.includes('\\Flagged'),
              isImportant: messageInfo.flags.includes('\\Important') || messageInfo.flags.includes('$Important'),
              folderName: options.folder || 'INBOX', // Update folder name if changed
            },
            create: {
              messageId: parsedEmail.messageId,
              subject: parsedEmail.subject,
              body: parsedEmail.body,
              bodyHtml: parsedEmail.bodyHtml,
              fromAddress: parsedEmail.fromAddress,
              fromName: parsedEmail.fromName,
              toAddresses: parsedEmail.toAddresses,
              ccAddresses: parsedEmail.ccAddresses,
              bccAddresses: parsedEmail.bccAddresses,
              isRead: messageInfo.flags.includes('\\Seen'),
              isStarred: messageInfo.flags.includes('\\Flagged'),
              isImportant: messageInfo.flags.includes('\\Important') || messageInfo.flags.includes('$Important'),
              sentAt: parsedEmail.sentAt,
              receivedAt: parsedEmail.receivedAt,
              folderName: options.folder || 'INBOX', // Use original IMAP folder name
              threadId: parsedEmail.threadId,
              inReplyTo: parsedEmail.inReplyTo,
              references: parsedEmail.references,
              attachments: parsedEmail.attachments || [],
              size: parsedEmail.size,
              userId,
              emailAccountId,
            },
          });

          this.logger.debug(`Saved email ${parsedEmail.messageId} to database`);
          resolve();
        } catch (error) {
          this.logger.error(`Failed to process message ${seqno}:`, error.message);
          // Don't reject - just resolve to continue with other messages
          // This prevents one bad email from stopping the entire sync
          resolve();
        }
      });
    });
  }

  /**
   * Gets folder list from IMAP server
   */
  async getImapFolders(connection: Imap): Promise<ImapFolderInfo[]> {
    return new Promise((resolve, reject) => {
      connection.getBoxes((err, boxes) => {
        if (err) {
          reject(new BadRequestException(`Failed to get folders: ${err.message}`));
          return;
        }

        const folders = this.parseImapBoxes(boxes);
        resolve(folders);
      });
    });
  }

  /**
   * Parses IMAP boxes into folder structure
   */
  private parseImapBoxes(boxes: any, parentName = ''): ImapFolderInfo[] {
    const folders: ImapFolderInfo[] = [];

    for (const [name, box] of Object.entries(boxes)) {
      const boxData = box as any;
      const fullName = parentName ? `${parentName}${boxData.delimiter}${name}` : name;
      
      const folder: ImapFolderInfo = {
        name: fullName,
        delimiter: boxData.delimiter || '/',
        parent: parentName || undefined,
        flags: boxData.attribs || [],
        uidvalidity: 0, // Will be set when box is opened
        uidnext: 0,
        exists: 0,
        recent: 0,
      };

      // Add children if they exist
      if (boxData.children) {
        folder.children = this.parseImapBoxes(boxData.children, fullName);
      }

      folders.push(folder);
    }

    return folders;
  }

  /**
   * Closes IMAP connection for an email account
   */
  async closeConnection(emailAccountId: string): Promise<void> {
    this.imapConnection.closeConnection(emailAccountId);
  }

  /**
   * Gets connection status for an email account
   */
  getConnectionStatus(emailAccountId: string): string {
    return this.imapConnection.getConnectionStatus(emailAccountId);
  }

  /**
   * Enhanced multi-folder email sync with spam detection
   */
  async syncMultipleFolders(
    emailAccountId: string,
    userId: string,
    options: EnhancedImapSyncOptions = {},
  ): Promise<MultiSyncResult> {
    // Delegate to the new progress-enabled version
    return this.syncMultipleFoldersWithProgress(emailAccountId, userId, options);
  }

  /**
   * OLD Syncs emails from multiple folders (DEPRECATED)
   */
  async syncMultipleFoldersOld(
    emailAccountId: string,
    userId: string,
    options: EnhancedImapSyncOptions = {},
  ): Promise<MultiSyncResult> {
    const startTime = Date.now();
    const result: MultiSyncResult = {
      totalFolders: 0,
      syncedFolders: [],
      failedFolders: [],
      totalMessages: 0,
      syncedMessages: 0,
      errors: [],
      duration: 0,
      folderResults: {},
    };

    try {
      // Get email account with IMAP credentials
      const emailAccount = await this.prisma.emailAccount.findFirst({
        where: { id: emailAccountId, userId },
      });

      if (!emailAccount) {
        throw new BadRequestException('Email account not found');
      }

      if (!emailAccount.imapHost || !emailAccount.password) {
        throw new BadRequestException('Email account is not configured for IMAP');
      }

      // Create IMAP connection config
      const config: ImapConnectionConfig = {
        host: emailAccount.imapHost,
        port: emailAccount.imapPort || 993,
        user: emailAccount.email,
        password: emailAccount.password,
        security: (emailAccount.imapSecurity as ImapSecurity) || ImapSecurity.TLS,
      };

      // Get IMAP connection
      const connection = await this.imapConnection.getConnection(emailAccountId, config);

      // Get all available folders
      const allFolders = await this.getImapFolders(connection);
      
      // Determine which folders to sync - SYNC ALL FOLDERS FOR COMPREHENSIVE EMAIL COVERAGE
      let foldersToSync: string[] = [];
      
      if (options.folders && options.folders.length > 0) {
        // Use explicitly specified folders
        foldersToSync = options.folders;
      } else if (options.folders && options.folders.length === 0) {
        // Empty array means sync ALL folders (unlimited sync)
        foldersToSync = allFolders.map(folder => folder.name);
        this.logger.log(`UNLIMITED SYNC: Will sync ALL ${foldersToSync.length} folders`);
      } else {
        // SMART SYNC: Auto-detect important folders, avoid system/trash folders
        const suggestions = this.folderDetection.suggestFoldersToSync(allFolders, options.includeSpam);
        foldersToSync = suggestions.recommended;
        
        // Add spam folders if requested
        if (options.includeSpam !== false) {
          const spamFolders = this.folderDetection.detectSpamFolders(allFolders);
          // Only add spam folders that aren't already in recommended
          for (const spamFolder of spamFolders) {
            if (!foldersToSync.includes(spamFolder)) {
              foldersToSync.push(spamFolder);
            }
          }
        }
        
        // Add inbox if not already included and requested
        if (options.includeInbox !== false && !foldersToSync.includes('INBOX')) {
          foldersToSync.unshift('INBOX');
        }
        
        this.logger.log(`SMART SYNC: Selected ${foldersToSync.length} important folders from ${allFolders.length} total folders`);
        this.logger.log(`Folders to sync: ${foldersToSync.join(', ')}`);
      }

      result.totalFolders = foldersToSync.length;
      this.logger.log(`Starting multi-folder sync for ${result.totalFolders} folders: ${foldersToSync.join(', ')}`);

      // Sync folders based on strategy
      if (options.strategy === SyncStrategy.PARALLEL) {
        await this.syncFoldersParallel(connection, emailAccountId, userId, foldersToSync, options, result);
      } else {
        await this.syncFoldersSequential(connection, emailAccountId, userId, foldersToSync, options, result);
      }

      result.duration = Date.now() - startTime;
      this.logger.log(`Multi-folder sync completed in ${result.duration}ms: ${result.syncedMessages}/${result.totalMessages} messages from ${result.syncedFolders.length}/${result.totalFolders} folders`);

      return result;
    } catch (error) {
      result.duration = Date.now() - startTime;
      const errorMessage = `Multi-folder sync failed for account ${emailAccountId}: ${error.message}`;
      result.errors.push(errorMessage);
      this.logger.error(errorMessage);
      
      if (!options.continueOnError) {
        throw new InternalServerErrorException(errorMessage);
      }
      
      return result;
    }
  }

  /**
   * Syncs folders in parallel with concurrency control
   */
  private async syncFoldersParallel(
    connection: Imap,
    emailAccountId: string,
    userId: string,
    folders: string[],
    options: EnhancedImapSyncOptions,
    result: MultiSyncResult,
  ): Promise<void> {
    const maxConcurrency = options.maxConcurrency || 3;
    const semaphore = Array(maxConcurrency).fill(null).map(() => Promise.resolve());
    let semaphoreIndex = 0;

    const syncPromises = folders.map(async (folder) => {
      // Wait for available slot
      await semaphore[semaphoreIndex];
      
      // Start sync and update semaphore
      const syncPromise = this.syncFolderWithErrorHandling(
        connection,
        emailAccountId,
        userId,
        folder,
        options,
        result,
      );
      
      semaphore[semaphoreIndex] = syncPromise.catch(() => {}); // Don't propagate errors in semaphore
      semaphoreIndex = (semaphoreIndex + 1) % maxConcurrency;
      
      return syncPromise;
    });

    await Promise.allSettled(syncPromises);
  }

  /**
   * Syncs folders sequentially
   */
  private async syncFoldersSequential(
    connection: Imap,
    emailAccountId: string,
    userId: string,
    folders: string[],
    options: EnhancedImapSyncOptions,
    result: MultiSyncResult,
  ): Promise<void> {
    for (const folder of folders) {
      await this.syncFolderWithErrorHandling(
        connection,
        emailAccountId,
        userId,
        folder,
        options,
        result,
      );
    }
  }

  /**
   * Syncs a single folder with error handling
   */
  private async syncFolderWithErrorHandling(
    connection: Imap,
    emailAccountId: string,
    userId: string,
    folder: string,
    options: EnhancedImapSyncOptions,
    result: MultiSyncResult,
  ): Promise<void> {
    try {
      this.logger.log(`Starting sync for folder: ${folder}`);
      
      // Convert enhanced options to legacy options for folder sync
      const legacyOptions: ImapSyncOptions = {
        folder,
        limit: options.limit || undefined,
        sinceUid: options.sinceUid,
        markSeen: options.markSeen,
        fetchBody: options.fetchBody,
        fetchAttachments: options.fetchAttachments,
      };

      const folderResult = await this.syncFolderEmails(connection, emailAccountId, userId, legacyOptions);
      
      result.syncedFolders.push(folder);
      result.totalMessages += folderResult.totalMessages;
      result.syncedMessages += folderResult.syncedCount;
      result.folderResults[folder] = {
        syncedCount: folderResult.syncedCount,
        totalMessages: folderResult.totalMessages,
        errors: [],
      };

      this.logger.log(`Completed sync for folder ${folder}: ${folderResult.syncedCount}/${folderResult.totalMessages} messages`);
    } catch (error) {
      const errorMessage = `Failed to sync folder ${folder}: ${error.message}`;
      result.errors.push(errorMessage);
      result.failedFolders.push({ folder, error: error.message });
      result.folderResults[folder] = {
        syncedCount: 0,
        totalMessages: 0,
        errors: [error.message],
      };
      
      this.logger.error(errorMessage);
      
      if (!options.continueOnError) {
        throw error;
      }
    }
  }

  /**
   * Gets folder recommendations for sync
   */
  async getFolderRecommendations(emailAccountId: string, userId: string): Promise<{
    folder: string;
    type: string;
    confidence: number;
    shouldSync: boolean;
    reason: string;
  }[]> {
    try {
      const folders = await this.getFolders(emailAccountId, userId);
      return this.folderDetection.getFolderRecommendations(folders);
    } catch (error) {
      this.logger.error(`Failed to get folder recommendations for account ${emailAccountId}:`, error.message);
      throw new InternalServerErrorException(`Failed to get folder recommendations: ${error.message}`);
    }
  }

  /**
   * Detects spam folders for an email account
   */
  async detectSpamFolders(emailAccountId: string, userId: string): Promise<string[]> {
    try {
      const folders = await this.getFolders(emailAccountId, userId);
      return this.folderDetection.detectSpamFolders(folders);
    } catch (error) {
      this.logger.error(`Failed to detect spam folders for account ${emailAccountId}:`, error.message);
      throw new InternalServerErrorException(`Failed to detect spam folders: ${error.message}`);
    }
  }

  /**
   * Get message count for a specific folder
   */
  async getFolderMessageCount(connection: any, folderName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      connection.openBox(folderName, true, (err, box) => {
        if (err) {
          this.logger.warn(`Failed to open folder ${folderName}: ${err.message}`);
          resolve(0);
          return;
        }
        resolve(box.messages.total || 0);
      });
    });
  }

  /**
   * Get IMAP connection for an email account (used by sync service)
   */
  async getConnection(emailAccountId: string, userId: string): Promise<any> {
    // Get email account
    const emailAccount = await this.prisma.emailAccount.findFirst({
      where: { id: emailAccountId, userId },
    });

    if (!emailAccount) {
      throw new Error('Email account not found');
    }

    // Create connection config
    const config: ImapConnectionConfig = {
      host: emailAccount.imapHost,
      port: emailAccount.imapPort || 993,
      user: emailAccount.email,
      password: emailAccount.password, // Will be decrypted by Prisma middleware
      security: (emailAccount.imapSecurity as ImapSecurity) || ImapSecurity.TLS,
    };

    return this.imapConnection.getConnection(emailAccountId, config);
  }

  /**
   * Sync emails from a folder with progress updates
   */
  async syncEmailsWithProgress(
    emailAccountId: string,
    userId: string,
    options: ImapSyncOptions = {},
    progressCallback?: (processedCount: number) => void
  ): Promise<{ syncedCount: number; totalMessages: number }> {
    try {
      // Get email account with IMAP credentials
      const emailAccount = await this.prisma.emailAccount.findFirst({
        where: { id: emailAccountId, userId },
      });

      if (!emailAccount) {
        throw new BadRequestException('Email account not found');
      }

      if (!emailAccount.imapHost || !emailAccount.password) {
        throw new BadRequestException('Email account is not configured for IMAP');
      }

      // Create IMAP connection config
      const config: ImapConnectionConfig = {
        host: emailAccount.imapHost,
        port: emailAccount.imapPort || 993,
        user: emailAccount.email,
        password: emailAccount.password, // This will be decrypted by Prisma middleware
        security: (emailAccount.imapSecurity as ImapSecurity) || ImapSecurity.TLS,
      };

      // Get IMAP connection
      const connection = await this.imapConnection.getConnection(emailAccountId, config);
      
      // Sync emails from specified folder with progress
      const result = await this.syncFolderEmailsWithProgress(connection, emailAccountId, userId, options, progressCallback);
      
      this.logger.log(`Email sync completed for account ${emailAccountId}: ${result.syncedCount}/${result.totalMessages} messages`);
      
      return result;
    } catch (error) {
      this.logger.error(`Email sync failed for account ${emailAccountId}:`, error.message);
      throw new InternalServerErrorException(`Email sync failed: ${error.message}`);
    }
  }

  /**
   * Syncs emails from a specific folder with progress updates
   */
  private async syncFolderEmailsWithProgress(
    connection: Imap,
    emailAccountId: string,
    userId: string,
    options: ImapSyncOptions,
    progressCallback?: (processedCount: number) => void,
  ): Promise<{ syncedCount: number; totalMessages: number }> {
    return new Promise((resolve, reject) => {
      const folder = options.folder || 'INBOX';
      
      connection.openBox(folder, true, (err, box) => {
        if (err) {
          reject(new BadRequestException(`Failed to open folder ${folder}: ${err.message}`));
          return;
        }

        if (box.messages.total === 0) {
          resolve({ syncedCount: 0, totalMessages: 0 });
          return;
        }

        this.logger.log(`Opened folder ${folder}: ${box.messages.total} total messages`);

        // Determine message range to fetch - SYNC ALL EMAILS
        const totalMessages = box.messages.total;
        const limit = options.limit;
        
        let fetchRange: string;
        if (limit && limit > 0) {
          // If limit specified, get the most recent emails
          const startSeq = Math.max(1, totalMessages - limit + 1);
          const endSeq = totalMessages;
          fetchRange = `${startSeq}:${endSeq}`;
          this.logger.log(`Fetching messages ${fetchRange} from folder ${folder} (limited to ${limit})`);
        } else {
          // NO LIMIT - FETCH ALL EMAILS
          fetchRange = `1:${totalMessages}`;
          this.logger.log(`Fetching ALL messages ${fetchRange} from folder ${folder} (${totalMessages} total emails)`);
        }

        // Fetch message headers and UIDs
        const fetch = connection.seq.fetch(fetchRange, {
          bodies: options.fetchBody ? '' : 'HEADER',
          struct: true,
          envelope: true,
        });

        let syncedCount = 0;
        const messagePromises: Promise<void>[] = [];

        fetch.on('message', (msg, seqno) => {
          const messagePromise = this.processImapMessage(msg, seqno, emailAccountId, userId, options)
            .then(() => {
              syncedCount++;
              // Update progress every 10 emails to avoid too many updates
              if (syncedCount % 10 === 0 || syncedCount === totalMessages) {
                progressCallback?.(syncedCount);
              }
              this.logger.debug(`Successfully processed message ${seqno} (${syncedCount}/${totalMessages})`);
            })
            .catch((error) => {
              this.logger.error(`Failed to process message ${seqno}:`, error.message);
              // Don't increment syncedCount for failed messages
            });
          messagePromises.push(messagePromise);
        });

        fetch.once('error', (err) => {
          this.logger.error(`Fetch error in folder ${folder}:`, err.message);
          reject(new InternalServerErrorException(`Fetch error: ${err.message}`));
        });

        fetch.once('end', async () => {
          try {
            // Wait for all messages to be processed
            await Promise.allSettled(messagePromises);
            
            // Final progress update
            progressCallback?.(syncedCount);
            
            this.logger.log(`Finished fetching from folder ${folder}: ${syncedCount} messages processed`);
            resolve({ syncedCount, totalMessages });
          } catch (error) {
            reject(error);
          }
        });
      });
    });
  }

  /**
   * Sync multiple folders with real-time progress tracking
   */
  async syncMultipleFoldersWithProgress(
    emailAccountId: string,
    userId: string,
    options: EnhancedImapSyncOptions = {},
    progressCallback?: (update: any) => void
  ): Promise<MultiSyncResult> {
    try {
      const connection = await this.getConnection(emailAccountId, userId);
      const allFolders = await this.getImapFolders(connection);
      
      // Determine folders to sync
      let foldersToSync: string[] = [];
      if (options.folders && options.folders.length > 0) {
        foldersToSync = options.folders;
      } else if (options.folders && options.folders.length === 0) {
        // Empty array means sync ALL folders
        foldersToSync = allFolders.map(folder => folder.name);
      } else {
        // Smart sync - important folders only
        const suggestions = this.folderDetection.suggestFoldersToSync(allFolders, options.includeSpam);
        foldersToSync = suggestions.recommended;
        
        if (options.includeSpam !== false) {
          const spamFolders = this.folderDetection.detectSpamFolders(allFolders);
          for (const spamFolder of spamFolders) {
            if (!foldersToSync.includes(spamFolder)) {
              foldersToSync.push(spamFolder);
            }
          }
        }
        
        if (options.includeInbox !== false && !foldersToSync.includes('INBOX')) {
          foldersToSync.unshift('INBOX');
        }
      }

      // Calculate total emails across all folders for progress
      let totalEmails = 0;
      const folderEmailCounts = new Map<string, number>();
      
      progressCallback?.({
        message: 'Counting emails in all folders...',
        currentFolder: 'Scanning',
        totalFolders: foldersToSync.length,
        foldersProcessed: 0,
        emailsProcessed: 0,
        totalEmails: 0,
      });

      for (let i = 0; i < foldersToSync.length; i++) {
        const folderName = foldersToSync[i];
        try {
          const count = await this.getFolderMessageCount(connection, folderName);
          folderEmailCounts.set(folderName, count);
          totalEmails += count;
          
          progressCallback?.({
            message: `Scanned ${folderName}: ${count} emails`,
            currentFolder: folderName,
            totalFolders: foldersToSync.length,
            foldersProcessed: i + 1,
            emailsProcessed: 0,
            totalEmails,
          });
        } catch (error) {
          this.logger.warn(`Failed to count emails in folder ${folderName}: ${error.message}`);
          folderEmailCounts.set(folderName, 0);
        }
      }

      // Now sync each folder with progress tracking
      const result: MultiSyncResult = {
        totalFolders: foldersToSync.length,
        syncedFolders: [],
        failedFolders: [],
        totalMessages: totalEmails,
        syncedMessages: 0,
        errors: [],
        duration: 0,
        folderResults: {},
      };

      const startTime = Date.now();
      let emailsProcessed = 0;

      for (let i = 0; i < foldersToSync.length; i++) {
        const folderName = foldersToSync[i];
        const folderEmailCount = folderEmailCounts.get(folderName) || 0;
        
        progressCallback?.({
          message: `Syncing folder: ${folderName} (${folderEmailCount} emails)`,
          currentFolder: folderName,
          totalFolders: foldersToSync.length,
          foldersProcessed: i,
          emailsProcessed,
          totalEmails,
        });

        try {
          // Create a progress callback for individual folder sync
          const folderProgressCallback = (processedCount: number) => {
            const currentFolderEmailsProcessed = emailsProcessed + processedCount;
            progressCallback?.({
              message: `Syncing ${folderName}: ${processedCount}/${folderEmailCount} emails`,
              currentFolder: folderName,
              totalFolders: foldersToSync.length,
              foldersProcessed: i,
              emailsProcessed: currentFolderEmailsProcessed,
              totalEmails,
            });
          };

          const folderResult = await this.syncEmailsWithProgress(emailAccountId, userId, {
            folder: folderName,
            limit: options.limit, // null = unlimited
            fetchBody: options.fetchBody,
            fetchAttachments: options.fetchAttachments,
            markSeen: options.markSeen,
          }, folderProgressCallback);

          result.syncedFolders.push(folderName);
          result.syncedMessages += folderResult.syncedCount;
          emailsProcessed += folderResult.syncedCount;
          
          result.folderResults[folderName] = {
            syncedCount: folderResult.syncedCount,
            totalMessages: folderResult.totalMessages,
            errors: [],
          };

          progressCallback?.({
            message: `Completed ${folderName}: ${folderResult.syncedCount}/${folderResult.totalMessages} emails`,
            currentFolder: folderName,
            totalFolders: foldersToSync.length,
            foldersProcessed: i + 1,
            emailsProcessed,
            totalEmails,
          });

        } catch (error) {
          this.logger.error(`Failed to sync folder ${folderName}: ${error.message}`);
          result.failedFolders.push({ folder: folderName, error: error.message });
          result.errors.push(`Folder ${folderName}: ${error.message}`);
          
          result.folderResults[folderName] = {
            syncedCount: 0,
            totalMessages: folderEmailCount,
            errors: [error.message],
          };
        }
      }

      result.duration = Date.now() - startTime;
      
      this.logger.log(
        `Multi-folder sync completed: ${result.syncedMessages}/${result.totalMessages} emails from ${result.syncedFolders.length}/${result.totalFolders} folders in ${result.duration}ms`
      );

      return result;
    } catch (error) {
      this.logger.error('Multi-folder sync failed:', error.message);
      throw new InternalServerErrorException(`Multi-folder sync failed: ${error.message}`);
    }
  }
}