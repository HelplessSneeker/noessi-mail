import { IsEmail, IsString, IsNotEmpty, IsOptional, IsInt, IsIn, Min, Max } from 'class-validator';

export class CreateEmailAccountDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['gmail', 'outlook', 'imap'])
  provider: string;

  // OAuth2 fields (for Gmail, Outlook)
  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  tokenExpiresAt?: Date;

  // IMAP/SMTP fields (for manual configuration)
  @IsOptional()
  @IsString()
  imapHost?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  imapPort?: number;

  @IsOptional()
  @IsString()
  @IsIn(['tls', 'starttls', 'none'])
  imapSecurity?: string;

  @IsOptional()
  @IsString()
  smtpHost?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort?: number;

  @IsOptional()
  @IsString()
  @IsIn(['tls', 'starttls', 'none'])
  smtpSecurity?: string;

  @IsOptional()
  @IsString()
  password?: string;
}

export class UpdateEmailAccountDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @IsIn(['gmail', 'outlook', 'imap'])
  provider?: string;

  // OAuth2 fields (for Gmail, Outlook)
  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  tokenExpiresAt?: Date;

  // IMAP/SMTP fields (for manual configuration)
  @IsOptional()
  @IsString()
  imapHost?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  imapPort?: number;

  @IsOptional()
  @IsString()
  @IsIn(['tls', 'starttls', 'none'])
  imapSecurity?: string;

  @IsOptional()
  @IsString()
  smtpHost?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort?: number;

  @IsOptional()
  @IsString()
  @IsIn(['tls', 'starttls', 'none'])
  smtpSecurity?: string;

  @IsOptional()
  @IsString()
  password?: string;
}