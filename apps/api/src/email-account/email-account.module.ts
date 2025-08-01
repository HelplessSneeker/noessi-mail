import { Module } from '@nestjs/common';
import { EmailAccountController } from './email-account.controller';
import { EmailAccountService } from './email-account.service';
import { ProgressTrackerService } from './progress-tracker.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ImapModule } from '../imap/imap.module';

@Module({
  imports: [PrismaModule, ImapModule],
  controllers: [EmailAccountController],
  providers: [EmailAccountService, ProgressTrackerService],
  exports: [EmailAccountService],
})
export class EmailAccountModule {}