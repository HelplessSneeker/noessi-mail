import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EmailService } from './email.service';
import { GetEmailsDto, EmailResponseDto, EmailStatsDto } from './dto/email.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('emails')
@UseGuards(JwtAuthGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get()
  async getEmails(
    @Request() req,
    @Query() query: GetEmailsDto,
  ): Promise<{ emails: EmailResponseDto[]; total: number; page: number; limit: number }> {
    const result = await this.emailService.getEmails(req.user.userId, query);
    
    return {
      ...result,
      page: query.page || 1,
      limit: query.limit || 50,
    };
  }

  @Get('stats')
  async getEmailStats(@Request() req): Promise<EmailStatsDto> {
    return this.emailService.getEmailStats(req.user.userId);
  }

  @Get(':id')
  async getEmailById(
    @Request() req,
    @Param('id') emailId: string,
  ): Promise<EmailResponseDto> {
    return this.emailService.getEmailById(req.user.userId, emailId);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Request() req,
    @Param('id') emailId: string,
  ): Promise<EmailResponseDto> {
    return this.emailService.markAsRead(req.user.userId, emailId);
  }

  @Post(':id/unread')
  @HttpCode(HttpStatus.OK)
  async markAsUnread(
    @Request() req,
    @Param('id') emailId: string,
  ): Promise<EmailResponseDto> {
    return this.emailService.markAsUnread(req.user.userId, emailId);
  }

  @Post(':id/star')
  @HttpCode(HttpStatus.OK)
  async toggleStar(
    @Request() req,
    @Param('id') emailId: string,
  ): Promise<EmailResponseDto> {
    return this.emailService.toggleStar(req.user.userId, emailId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEmail(
    @Request() req,
    @Param('id') emailId: string,
  ): Promise<void> {
    return this.emailService.deleteEmail(req.user.userId, emailId);
  }
}