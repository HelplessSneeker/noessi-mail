import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmailAccountDto, UpdateEmailAccountDto } from './dto/email-account.dto';

@Injectable()
export class EmailAccountService {
  constructor(private prisma: PrismaService) {}

  async findAllByUserId(userId: string) {
    return this.prisma.emailAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const emailAccount = await this.prisma.emailAccount.findFirst({
      where: { id, userId },
    });

    if (!emailAccount) {
      throw new NotFoundException('Email account not found');
    }

    return emailAccount;
  }

  async create(userId: string, createEmailAccountDto: CreateEmailAccountDto) {
    // Check if email account already exists for this user
    const existingAccount = await this.prisma.emailAccount.findFirst({
      where: {
        email: createEmailAccountDto.email,
        userId,
      },
    });

    if (existingAccount) {
      throw new ConflictException('Email account already exists');
    }

    return this.prisma.emailAccount.create({
      data: {
        ...createEmailAccountDto,
        userId,
      },
    });
  }

  async update(
    id: string,
    userId: string,
    updateEmailAccountDto: UpdateEmailAccountDto,
  ) {
    // Check if the email account exists and belongs to the user
    await this.findOne(id, userId);

    // If updating email, check for conflicts
    if (updateEmailAccountDto.email) {
      const existingAccount = await this.prisma.emailAccount.findFirst({
        where: {
          email: updateEmailAccountDto.email,
          userId,
          id: { not: id },
        },
      });

      if (existingAccount) {
        throw new ConflictException('Email account with this email already exists');
      }
    }

    return this.prisma.emailAccount.update({
      where: { id },
      data: updateEmailAccountDto,
    });
  }

  async remove(id: string, userId: string) {
    // Check if the email account exists and belongs to the user
    await this.findOne(id, userId);

    return this.prisma.emailAccount.delete({
      where: { id },
    });
  }
}