import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as Imap from 'node-imap';
import { ImapConnectionService } from './imap-connection.service';
import { EmailParserService, ParsedEmailData } from './email-parser.service';
import { ImapConnectionConfig, ImapSecurity, ImapSyncOptions, ImapFolderInfo, TestConnectionDto } from './dto/imap.dto';

@Injectable()
export class ImapService {
  private readonly logger = new Logger(ImapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly imapConnection: ImapConnectionService,
    private readonly emailParser: EmailParserService,
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

        // Determine message range to fetch
        const totalMessages = box.messages.total;
        const limit = options.limit || 50;
        const startSeq = Math.max(1, totalMessages - limit + 1);
        const endSeq = totalMessages;

        const fetchRange = `${startSeq}:${endSeq}`;
        this.logger.log(`Fetching messages ${fetchRange} from folder ${folder}`);

        // Fetch message headers and UIDs
        const fetch = connection.seq.fetch(fetchRange, {
          bodies: options.fetchBody ? '' : 'HEADER',
          struct: true,
          envelope: true,
        });

        let syncedCount = 0;
        const messagePromises: Promise<void>[] = [];

        fetch.on('message', (msg, seqno) => {
          const messagePromise = this.processImapMessage(msg, seqno, emailAccountId, userId, options);
          messagePromises.push(messagePromise);
          
          messagePromise
            .then(() => {
              syncedCount++;
            })
            .catch((error) => {
              this.logger.error(`Failed to process message ${seqno}:`, error.message);
            });
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

          // Save email to database
          await this.prisma.email.create({
            data: {
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
              folderName: options.folder || 'INBOX',
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
          reject(error);
        }
      });
    });
  }

  /**
   * Gets folder list from IMAP server
   */
  private async getImapFolders(connection: Imap): Promise<ImapFolderInfo[]> {
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
}