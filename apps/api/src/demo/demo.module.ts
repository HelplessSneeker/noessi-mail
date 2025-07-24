import { Module } from '@nestjs/common';
import { DemoController } from './demo.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DemoController],
})
export class DemoModule {}