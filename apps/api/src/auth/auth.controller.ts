import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req) {
    const tokens = await this.authService.generateTokens(req.user.id, req.user.email);
    await this.authService.updateRefreshToken(req.user.id, tokens.refreshToken);

    return {
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
      },
      ...tokens,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req) {
    await this.authService.logout(req.user.sub);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto, @Req() req) {
    return this.authService.refreshTokens(req.user.sub, dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me')
  @HttpCode(HttpStatus.OK)
  async me(@Req() req) {
    const user = await this.authService.getUser(req.user.sub);
    return { user };
  }
}
