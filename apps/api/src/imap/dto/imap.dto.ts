import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsArray, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export enum ImapSecurity {
  TLS = 'tls',
  STARTTLS = 'starttls',
  NONE = 'none',
}

export class ImapConnectionConfig {
  @IsString()
  host: string;

  @IsNumber()
  port: number;

  @IsString()
  user: string;

  @IsString()
  password: string;

  @IsEnum(ImapSecurity)
  security: ImapSecurity;

  @IsOptional()
  @IsBoolean()
  keepAlive?: boolean = true;

  @IsOptional()
  @IsNumber()
  connTimeout?: number = 10000;

  @IsOptional()
  @IsNumber()
  authTimeout?: number = 5000;

  @IsOptional()
  @IsNumber()
  socketTimeout?: number = 30000;
}

export class ImapFolderInfo {
  name: string;
  delimiter: string;
  parent?: string;
  children?: ImapFolderInfo[];
  flags: string[];
  uidvalidity: number;
  uidnext: number;
  exists: number;
  recent: number;
}

export class ImapMessageInfo {
  uid: number;
  messageId: string;
  subject?: string;
  from: string[];
  to: string[];
  cc?: string[];
  bcc?: string[];
  date: Date;
  flags: string[];
  size: number;
  bodyStructure?: any;
  envelope?: any;
}

export class ImapSyncOptions {
  @IsOptional()
  @IsString()
  folder?: string = 'INBOX';

  @IsOptional()
  @IsNumber()
  limit?: number = 50;

  @IsOptional()
  @IsNumber()
  sinceUid?: number;

  @IsOptional()
  @IsBoolean()
  markSeen?: boolean = false;

  @IsOptional()
  @IsBoolean()
  fetchBody?: boolean = true;

  @IsOptional()
  @IsBoolean()
  fetchAttachments?: boolean = false;
}

export enum SyncStrategy {
  PARALLEL = 'parallel',
  SEQUENTIAL = 'sequential',
}

export class EnhancedImapSyncOptions {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  folders?: string[]; // Auto-detect if empty

  @IsOptional()
  @IsBoolean()
  includeSpam?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeInbox?: boolean = true;

  @IsOptional()
  @Transform(({ value }) => value === null ? null : parseInt(value))
  @IsNumber()
  @Min(1)
  limit?: number | null = null; // null = unlimited

  @IsOptional()
  @IsEnum(SyncStrategy)
  strategy?: SyncStrategy = SyncStrategy.PARALLEL;

  @IsOptional()
  @IsBoolean()
  continueOnError?: boolean = true;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxConcurrency?: number = 3;

  @IsOptional()
  @IsBoolean()
  fetchBody?: boolean = true;

  @IsOptional()
  @IsBoolean()
  fetchAttachments?: boolean = false;

  @IsOptional()
  @IsNumber()
  sinceUid?: number;

  @IsOptional()
  @IsBoolean()
  markSeen?: boolean = false;
}

export interface MultiSyncResult {
  totalFolders: number;
  syncedFolders: string[];
  failedFolders: { folder: string; error: string }[];
  totalMessages: number;
  syncedMessages: number;
  errors: string[];
  duration: number;
  folderResults: {
    [folderName: string]: {
      syncedCount: number;
      totalMessages: number;
      errors: string[];
    };
  };
}

export class TestConnectionDto {
  @IsString()
  host: string;

  @IsNumber()
  port: number;

  @IsString()
  user: string;

  @IsString()
  password: string;

  @IsEnum(ImapSecurity)
  security: ImapSecurity;
}