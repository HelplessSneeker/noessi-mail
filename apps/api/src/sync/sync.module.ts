import { Module } from '@nestjs/common';
import { SyncGateway } from './sync.gateway';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { ImapModule } from '../imap/imap.module';
import { EmailAccountModule } from '../email-account/email-account.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ImapModule, EmailAccountModule, PrismaModule],
  controllers: [SyncController],
  providers: [SyncGateway, SyncService],
  exports: [SyncService, SyncGateway],
})
export class SyncModule {}