export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface CreateEmailAccountData {
  email: string;
  provider: string;
  // OAuth2 fields
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  // IMAP/SMTP fields
  imapHost?: string;
  imapPort?: number;
  imapSecurity?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecurity?: string;
  password?: string;
}

export interface UpdateEmailAccountData {
  email?: string;
  provider?: string;
  // OAuth2 fields
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  // IMAP/SMTP fields
  imapHost?: string;
  imapPort?: number;
  imapSecurity?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecurity?: string;
  password?: string;
}

export * from "@noessi/database";
