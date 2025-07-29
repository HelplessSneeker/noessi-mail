import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetEmailsDto, EmailResponseDto, EmailStatsDto } from './dto/email.dto';
import { Prisma, Email } from '@noessi/database';

@Injectable()
export class EmailService {
  constructor(private prisma: PrismaService) {}

  async getEmails(userId: string, query: GetEmailsDto): Promise<{ emails: EmailResponseDto[]; total: number }> {
    const { folder, page = 1, limit = 50, search, unreadOnly, starredOnly } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.EmailWhereInput = {
      userId,
      isDeleted: false, // Don't show deleted emails by default
    };

    // Filter by folder
    if (folder) {
      switch (folder.toLowerCase()) {
        case 'inbox':
          where.folderName = { in: ['INBOX', 'Inbox', 'inbox'] };
          break;
        case 'sent':
          where.folderName = { in: ['SENT', 'Sent', 'sent', 'SENT MAIL', 'Sent Mail'] };
          break;
        case 'drafts':
          where.isDraft = true;
          break;
        case 'spam':
          where.folderName = { in: ['SPAM', 'Spam', 'spam', 'JUNK', 'Junk'] };
          break;
        case 'deleted':
          where.isDeleted = true;
          break;
        default:
          where.folderName = folder;
      }
    }

    // Filter by read status
    if (unreadOnly) {
      where.isRead = false;
    }

    // Filter by starred status
    if (starredOnly) {
      where.isStarred = true;
    }

    // Search functionality
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
        { fromAddress: { contains: search, mode: 'insensitive' } },
        { fromName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await this.prisma.email.count({ where });

    // Get emails with pagination
    const emails = await this.prisma.email.findMany({
      where,
      orderBy: [
        { receivedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: limit,
    });

    return {
      emails: emails.map(this.mapToResponseDto),
      total,
    };
  }

  async getEmailById(userId: string, emailId: string): Promise<EmailResponseDto> {
    const email = await this.prisma.email.findFirst({
      where: {
        id: emailId,
        userId,
      },
    });

    if (!email) {
      throw new NotFoundException('Email not found');
    }

    return this.mapToResponseDto(email);
  }

  async markAsRead(userId: string, emailId: string): Promise<EmailResponseDto> {
    const email = await this.prisma.email.updateMany({
      where: {
        id: emailId,
        userId,
      },
      data: {
        isRead: true,
      },
    });

    if (email.count === 0) {
      throw new NotFoundException('Email not found');
    }

    return this.getEmailById(userId, emailId);
  }

  async markAsUnread(userId: string, emailId: string): Promise<EmailResponseDto> {
    const email = await this.prisma.email.updateMany({
      where: {
        id: emailId,
        userId,
      },
      data: {
        isRead: false,
      },
    });

    if (email.count === 0) {
      throw new NotFoundException('Email not found');
    }

    return this.getEmailById(userId, emailId);
  }

  async toggleStar(userId: string, emailId: string): Promise<EmailResponseDto> {
    const existingEmail = await this.prisma.email.findFirst({
      where: { id: emailId, userId },
      select: { isStarred: true },
    });

    if (!existingEmail) {
      throw new NotFoundException('Email not found');
    }

    await this.prisma.email.updateMany({
      where: {
        id: emailId,
        userId,
      },
      data: {
        isStarred: !existingEmail.isStarred,
      },
    });

    return this.getEmailById(userId, emailId);
  }

  async deleteEmail(userId: string, emailId: string): Promise<void> {
    const result = await this.prisma.email.updateMany({
      where: {
        id: emailId,
        userId,
      },
      data: {
        isDeleted: true,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Email not found');
    }
  }

  async getEmailStats(userId: string): Promise<EmailStatsDto> {
    // Get counts for different categories
    const [
      total,
      unread,
      starred,
      inbox,
      sent,
      drafts,
      spam,
      deleted,
    ] = await Promise.all([
      this.prisma.email.count({
        where: { userId, isDeleted: false },
      }),
      this.prisma.email.count({
        where: { userId, isDeleted: false, isRead: false },
      }),
      this.prisma.email.count({
        where: { userId, isDeleted: false, isStarred: true },
      }),
      this.prisma.email.count({
        where: {
          userId,
          isDeleted: false,
          folderName: { in: ['INBOX', 'Inbox', 'inbox'] },
        },
      }),
      this.prisma.email.count({
        where: {
          userId,
          isDeleted: false,
          folderName: { in: ['SENT', 'Sent', 'sent', 'SENT MAIL', 'Sent Mail'] },
        },
      }),
      this.prisma.email.count({
        where: { userId, isDeleted: false, isDraft: true },
      }),
      this.prisma.email.count({
        where: {
          userId,
          isDeleted: false,
          folderName: { in: ['SPAM', 'Spam', 'spam', 'JUNK', 'Junk'] },
        },
      }),
      this.prisma.email.count({
        where: { userId, isDeleted: true },
      }),
    ]);

    return {
      total,
      unread,
      starred,
      inbox,
      sent,
      drafts,
      spam,
      deleted,
    };
  }

  private mapToResponseDto(email: Email): EmailResponseDto {
    return {
      id: email.id,
      messageId: email.messageId,
      subject: email.subject,
      body: email.body,
      bodyHtml: email.bodyHtml,
      fromAddress: email.fromAddress,
      fromName: email.fromName,
      toAddresses: email.toAddresses,
      ccAddresses: email.ccAddresses,
      bccAddresses: email.bccAddresses,
      isRead: email.isRead,
      isStarred: email.isStarred,
      isImportant: email.isImportant,
      isArchived: email.isArchived,
      isDeleted: email.isDeleted,
      isDraft: email.isDraft,
      sentAt: email.sentAt,
      receivedAt: email.receivedAt,
      folderName: email.folderName,
      threadId: email.threadId,
      inReplyTo: email.inReplyTo,
      references: email.references,
      attachments: email.attachments,
      size: email.size,
      labels: email.labels,
      emailAccountId: email.emailAccountId,
      createdAt: email.createdAt,
      updatedAt: email.updatedAt,
    };
  }
}