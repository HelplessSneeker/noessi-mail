import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, AuthResponse, JwtPayload } from '@noessi/types';
import { CustomLoggerService } from '../logging/logging.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private logger: CustomLoggerService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    this.logger.logAuth('registration_attempt', { email: dto.email });
    
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      this.logger.logAuth('registration_failed', { 
        email: dto.email, 
        reason: 'user_already_exists' 
      });
      throw new ConflictException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    this.logger.logAuth('registration_success', { 
      userId: user.id, 
      email: user.email 
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    this.logger.logAuth('login_attempt', { email: dto.email });
    
    const user = await this.validateUser(dto.email, dto.password);
    
    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    this.logger.logAuth('login_success', { 
      userId: user.id, 
      email: user.email 
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      ...tokens,
    };
  }

  async logout(userId: string): Promise<void> {
    this.logger.logAuth('logout', { userId });
    
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<Omit<AuthResponse, 'user'>> {
    this.logger.logAuth('token_refresh_attempt', { userId });
    
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        userId,
        token: refreshToken,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      this.logger.logSecurityEvent('invalid_refresh_token', { userId });
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.logSecurityEvent('refresh_token_user_not_found', { userId });
      throw new UnauthorizedException('User not found');
    }

    // Delete old refresh token
    await this.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // Generate new tokens
    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    this.logger.logAuth('token_refresh_success', { userId });

    return tokens;
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.logSecurityEvent('failed_login_attempt', {
        email,
        reason: 'user_not_found'
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      this.logger.logSecurityEvent('failed_login_attempt', {
        email,
        userId: user.id,
        reason: 'invalid_password'
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async generateTokens(userId: string, email: string) {
    const payload: JwtPayload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });
  }

  async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
