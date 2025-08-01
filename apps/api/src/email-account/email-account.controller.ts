import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { EmailAccountService } from './email-account.service';
import { CreateEmailAccountDto, UpdateEmailAccountDto } from './dto/email-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImapService } from '../imap/imap.service';
import { EnhancedImapSyncOptions } from '../imap/dto/imap.dto';

@Controller('email-accounts')
@UseGuards(JwtAuthGuard)
export class EmailAccountController {
  private readonly logger = new Logger(EmailAccountController.name);

  constructor(
    private readonly emailAccountService: EmailAccountService,
    private readonly imapService: ImapService,
  ) {}

  @Post()
  create(@Request() req, @Body() createEmailAccountDto: CreateEmailAccountDto) {
    this.logger.log(`Creating email account for user ${req.user.userId}`);
    return this.emailAccountService.create(req.user.userId, createEmailAccountDto);
  }

  @Get()
  findAll(@Request() req) {
    this.logger.log(`Fetching email accounts for user ${req.user.userId}`);
    return this.emailAccountService.findAllByUserId(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    this.logger.log(`Fetching email account ${id} for user ${req.user.userId}`);
    return this.emailAccountService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateEmailAccountDto: UpdateEmailAccountDto,
  ) {
    this.logger.log(`Updating email account ${id} for user ${req.user.userId}`);
    return this.emailAccountService.update(id, req.user.userId, updateEmailAccountDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    this.logger.log(`Deleting email account ${id} for user ${req.user.userId}`);
    return this.emailAccountService.remove(id, req.user.userId);
  }

  /**
   * Test IMAP connection for an existing email account
   */
  @Post(':id/test-connection')
  async testConnection(@Param('id') id: string, @Request() req) {
    this.logger.log(`Testing IMAP connection for email account ${id}`);
    const userId = req.user.userId;
    return this.emailAccountService.testImapConnection(id, userId);
  }

  /**
   * Get email statistics for an account
   */
  @Get(':id/stats')
  async getEmailStats(@Param('id') id: string, @Request() req) {
    this.logger.log(`Getting email stats for account ${id}`);
    const userId = req.user.userId;
    return this.emailAccountService.getEmailStats(id, userId);
  }

  /**
   * Trigger full re-sync with enhanced options
   */
  @Post(':id/resync')
  async triggerFullResync(
    @Param('id') id: string,
    @Request() req,
    @Body() syncOptions: EnhancedImapSyncOptions = {},
  ) {
    this.logger.log(`Triggering full re-sync for email account ${id}`);
    const userId = req.user.userId;
    return this.emailAccountService.triggerFullResync(id, userId, syncOptions);
  }

  /**
   * Clear all emails and trigger fresh sync
   */
  @Post(':id/clear-and-resync')
  async clearAndResync(
    @Param('id') id: string,
    @Request() req,
    @Body() syncOptions: EnhancedImapSyncOptions = {},
  ) {
    this.logger.log(`Clearing emails and re-syncing for account ${id}`);
    const userId = req.user.userId;
    return this.emailAccountService.clearAndResync(id, userId, syncOptions);
  }

  /**
   * Unlimited sync for power users (syncs all emails from all folders)
   * WARNING: This can take a long time for large mailboxes
   */
  @Post(':id/unlimited-sync')
  async unlimitedSync(
    @Param('id') id: string,
    @Request() req,
    @Body() syncOptions: EnhancedImapSyncOptions = {},
  ) {
    this.logger.log(`Starting unlimited sync for account ${id}`);
    const userId = req.user.userId;
    return this.emailAccountService.unlimitedSync(id, userId, syncOptions);
  }

  /**
   * Get sync progress for an email account
   */
  @Get(':id/sync-progress')
  async getSyncProgress(@Param('id') id: string, @Request() req) {
    const progress = this.emailAccountService.getSyncProgress(id);
    
    if (!progress) {
      return {
        success: false,
        message: 'No sync in progress',
        accountId: id,
        inProgress: false,
      };
    }

    return {
      success: true,
      data: progress,
      inProgress: progress.isActive,
    };
  }
}