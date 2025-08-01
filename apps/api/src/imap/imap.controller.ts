import { Controller, Post, Get, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImapService } from './imap.service';
import { EmailMigrationService } from './email-migration.service';
import { TestConnectionDto, ImapSyncOptions, EnhancedImapSyncOptions } from './dto/imap.dto';

@Controller('imap')
@UseGuards(JwtAuthGuard)
export class ImapController {
  constructor(
    private readonly imapService: ImapService,
    private readonly emailMigrationService: EmailMigrationService,
  ) {}

  /**
   * Test IMAP connection with provided credentials
   */
  @Post('test-connection')
  async testConnection(@Body() testConnectionDto: TestConnectionDto) {
    return this.imapService.testConnection(testConnectionDto);
  }

  /**
   * Sync emails from IMAP server for a specific email account
   */
  @Post('sync/:emailAccountId')
  async syncEmails(
    @Param('emailAccountId') emailAccountId: string,
    @Request() req,
    @Body() syncOptions: ImapSyncOptions = {},
  ) {
    const userId = req.user.userId;
    return this.imapService.syncEmails(emailAccountId, userId, syncOptions);
  }

  /**
   * Get folders from IMAP server
   */
  @Get('folders/:emailAccountId')
  async getFolders(
    @Param('emailAccountId') emailAccountId: string,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.imapService.getFolders(emailAccountId, userId);
  }

  /**
   * Get connection status for an email account
   */
  @Get('status/:emailAccountId')
  async getConnectionStatus(@Param('emailAccountId') emailAccountId: string) {
    const status = this.imapService.getConnectionStatus(emailAccountId);
    return { emailAccountId, status };
  }

  /**
   * Close IMAP connection for an email account
   */
  @Post('close/:emailAccountId')
  async closeConnection(@Param('emailAccountId') emailAccountId: string) {
    await this.imapService.closeConnection(emailAccountId);
    return { success: true, message: 'Connection closed' };
  }

  /**
   * Enhanced multi-folder sync with spam detection
   */
  @Post('sync-multi/:emailAccountId')
  async syncMultipleFolders(
    @Param('emailAccountId') emailAccountId: string,
    @Request() req,
    @Body() syncOptions: EnhancedImapSyncOptions = {},
  ) {
    const userId = req.user.userId;
    return this.imapService.syncMultipleFolders(emailAccountId, userId, syncOptions);
  }

  /**
   * Get folder recommendations for sync
   */
  @Get('recommendations/:emailAccountId')
  async getFolderRecommendations(
    @Param('emailAccountId') emailAccountId: string,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.imapService.getFolderRecommendations(emailAccountId, userId);
  }

  /**
   * Detect spam folders for an email account
   */
  @Get('spam-folders/:emailAccountId')
  async detectSpamFolders(
    @Param('emailAccountId') emailAccountId: string,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.imapService.detectSpamFolders(emailAccountId, userId);
  }

  /**
   * Preview email folder migration (shows what would be changed)
   */
  @Get('migration/preview')
  async previewMigration() {
    return this.emailMigrationService.previewMigration();
  }

  /**
   * Migrate existing emails to use standardized folder names
   * This is a one-time operation to fix existing emails
   */
  @Post('migration/execute')
  async executeMigration() {
    return this.emailMigrationService.migrateExistingEmails();
  }
}