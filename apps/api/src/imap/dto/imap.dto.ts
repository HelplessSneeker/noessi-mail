import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum } from 'class-validator';

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