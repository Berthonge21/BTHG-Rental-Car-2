import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { setupSwagger } from './config/swagger.config';
import type { AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService<AppConfig>);
  const port = configService.get<number>('port') || 4000;
  const apiPrefix = configService.get<string>('apiPrefix') || 'api/v1';
  const corsOrigins = configService.get<string[]>('cors.origins') || ['http://localhost:3000'];
  const swaggerEnabled = configService.get<boolean>('swagger.enabled') ?? true;

  // Set global prefix
  app.setGlobalPrefix(apiPrefix);

  // Configure CORS
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Setup Swagger documentation
  if (swaggerEnabled) {
    setupSwagger(app);
    logger.log(`Swagger documentation available at http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  logger.log(`Application is running on http://localhost:${port}/${apiPrefix}`);
}

bootstrap();
