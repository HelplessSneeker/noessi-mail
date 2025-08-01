import { Module, OnModuleDestroy } from '@nestjs/common';
import { ImapService } from './imap.service';
import { ImapController } from './imap.controller';
import { ImapConnectionService } from './imap-connection.service';
import { EmailParserService } from './email-parser.service';
import { FolderDetectionService } from './folder-detection.service';
import { SmartFolderMapperService } from './smart-folder-mapper.service';
import { EmailMigrationService } from './email-migration.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ImapController],
  providers: [ImapService, ImapConnectionService, EmailParserService, FolderDetectionService, SmartFolderMapperService, EmailMigrationService],
  exports: [ImapService, ImapConnectionService],
})
export class ImapModule implements OnModuleDestroy {
  constructor(private readonly imapConnectionService: ImapConnectionService) {}

  /**
   * Clean up all IMAP connections when module is destroyed
   */
  onModuleDestroy(): void {
    this.imapConnectionService.closeAllConnections();
  }
}