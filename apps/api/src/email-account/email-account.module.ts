import { Module } from '@nestjs/common';
import { EmailAccountController } from './email-account.controller';
import { EmailAccountService } from './email-account.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EmailAccountController],
  providers: [EmailAccountService],
  exports: [EmailAccountService],
})
export class EmailAccountModule {}