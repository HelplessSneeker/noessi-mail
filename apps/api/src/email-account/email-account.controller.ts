import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { EmailAccountService } from './email-account.service';
import { CreateEmailAccountDto, UpdateEmailAccountDto } from './dto/email-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('email-accounts')
@UseGuards(JwtAuthGuard)
export class EmailAccountController {
  private readonly logger = new Logger(EmailAccountController.name);

  constructor(private readonly emailAccountService: EmailAccountService) {}

  @Post()
  create(@Request() req, @Body() createEmailAccountDto: CreateEmailAccountDto) {
    this.logger.log(`Creating email account for user ${req.user.userId}`);
    return this.emailAccountService.create(req.user.userId, createEmailAccountDto);
  }

  @Get()
  findAll(@Request() req) {
    this.logger.log(`Fetching email accounts for user ${req.user.userId}`);
    return this.emailAccountService.findAllByUserId(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    this.logger.log(`Fetching email account ${id} for user ${req.user.userId}`);
    return this.emailAccountService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateEmailAccountDto: UpdateEmailAccountDto,
  ) {
    this.logger.log(`Updating email account ${id} for user ${req.user.userId}`);
    return this.emailAccountService.update(id, req.user.userId, updateEmailAccountDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    this.logger.log(`Deleting email account ${id} for user ${req.user.userId}`);
    return this.emailAccountService.remove(id, req.user.userId);
  }
}