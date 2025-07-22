import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Replace default logger with Winston
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  
  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  
  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  logger.log(`API is running on: http://localhost:${port}`, 'Bootstrap');
}
bootstrap().catch((error) => {
  console.error('Failed to start the application:', error);
});
