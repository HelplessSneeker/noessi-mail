import { Controller, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { IsString, IsOptional, IsBoolean, IsNumber, IsNotEmpty, Min, Max } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SyncService, KeepAliveSyncOptions } from './sync.service';

export class StartSyncDto {
  @IsString()
  @IsNotEmpty()
  emailAccountId: string;

  @IsOptional()
  @IsBoolean()
  clearExisting?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeSpam?: boolean = true;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  batchSize?: number = 50;
}

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  /**
   * Start a keep-alive sync session with real-time progress updates
   */
  @Post('start')
  async startSync(@Body() startSyncDto: StartSyncDto, @Request() req) {
    const options: KeepAliveSyncOptions = {
      ...startSyncDto,
      userId: req.user.userId,
    };

    return this.syncService.startKeepAliveSync(options);
  }

  /**
   * Cancel an active sync session
   */
  @Delete(':sessionId')
  async cancelSync(@Param('sessionId') sessionId: string) {
    await this.syncService.cancelSync(sessionId);
    return { success: true, message: 'Sync session cancelled' };
  }
}