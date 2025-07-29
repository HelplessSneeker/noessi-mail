import { Controller, Post, Get, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImapService } from './imap.service';
import { TestConnectionDto, ImapSyncOptions } from './dto/imap.dto';

@Controller('imap')
@UseGuards(JwtAuthGuard)
export class ImapController {
  constructor(private readonly imapService: ImapService) {}

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
}