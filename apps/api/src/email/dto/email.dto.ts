import { IsOptional, IsString, IsBoolean, IsArray, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetEmailsDto {
  @IsOptional()
  @IsString()
  folder?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  unreadOnly?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  starredOnly?: boolean;
}

export class EmailResponseDto {
  id: string;
  messageId: string;
  subject?: string;
  body?: string;
  bodyHtml?: string;
  fromAddress: string;
  fromName?: string;
  toAddresses: string[];
  ccAddresses: string[];
  bccAddresses: string[];
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  isDraft: boolean;
  sentAt?: Date;
  receivedAt: Date;
  folderName?: string;
  threadId?: string;
  inReplyTo?: string;
  references: string[];
  attachments?: any;
  size?: number;
  labels: string[];
  emailAccountId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class EmailStatsDto {
  total: number;
  unread: number;
  starred: number;
  inbox: number;
  sent: number;
  drafts: number;
  spam: number;
  deleted: number;
}