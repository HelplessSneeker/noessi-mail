import { Controller, Get, Post, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('demo')
export class DemoController {
  constructor(private prisma: PrismaService) {}

  @Get('success')
  getSuccess() {
    return {
      message: 'This is a successful API response',
      timestamp: new Date().toISOString(),
      data: {
        users: ['user1', 'user2'],
        count: 2,
      },
    };
  }

  @Get('error/validation')
  getValidationError() {
    throw new HttpException(
      {
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details: {
          field: 'email',
          reason: 'Invalid email format',
        },
      },
      HttpStatus.BAD_REQUEST,
    );
  }

  @Get('error/not-found')
  getNotFoundError() {
    throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  }

  @Get('error/server')
  getServerError() {
    throw new Error('Unexpected server error occurred');
  }

  @Get('error/database/:id')
  async getDatabaseError(@Param('id') id: string) {
    // This will trigger a Prisma error
    try {
      await this.prisma.user.findUniqueOrThrow({
        where: { id: 'nonexistent-id' },
      });
    } catch (error) {
      throw error;
    }
  }

  @Post('error/duplicate')
  async getDuplicateError(@Body() data: { email: string }) {
    // This will trigger a unique constraint error if email already exists
    try {
      await this.prisma.user.create({
        data: {
          email: data.email,
          password: 'test',
          name: 'Test User',
        },
      });
      return { message: 'User created successfully' };
    } catch (error) {
      throw error;
    }
  }
}