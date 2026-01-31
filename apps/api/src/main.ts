import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { setupSwagger } from './config/swagger.config';

const banner = `
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   ____  _____ _   _  ____   ____            _        _           ║
║  | __ )|_   _| | | |/ ___| |  _ \\ ___ _ __ | |_ __ _| |          ║
║  |  _ \\  | | | |_| | |  _  | |_) / _ \\ '_ \\| __/ _\` | |          ║
║  | |_) | | | |  _  | |_| | |  _ <  __/ | | | || (_| | |          ║
║  |____/  |_| |_| |_|\\____| |_| \\_\\___|_| |_|\\__\\__,_|_|          ║
║                                                                  ║
║                    Car Rental Platform API                       ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
`;

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  // Display banner
  console.log('\x1b[36m%s\x1b[0m', banner);

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 4000;
  const apiPrefix = configService.get<string>('apiPrefix') || 'api/v1';
  const corsConfig = configService.get<{ origins: string[] }>('cors') || { origins: ['http://localhost:3000'] };
  const swaggerConfig = configService.get<{ enabled: boolean }>('swagger') || { enabled: true };

  // Set global prefix
  app.setGlobalPrefix(apiPrefix);

  // Configure CORS
  app.enableCors({
    origin: corsConfig.origins,
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
  if (swaggerConfig.enabled) {
    setupSwagger(app);
  }

  await app.listen(port);

  // Log startup information
  console.log('\x1b[32m%s\x1b[0m', '═══════════════════════════════════════════════════════════════════');
  logger.log(`Environment:  ${process.env.NODE_ENV || 'development'}`);
  logger.log(`API Server:   http://localhost:${port}/${apiPrefix}`);
  if (swaggerConfig.enabled) {
    logger.log(`Swagger Docs: http://localhost:${port}/api/docs`);
  }
  console.log('\x1b[32m%s\x1b[0m', '═══════════════════════════════════════════════════════════════════');
  logger.log('BTHG Rental Car API is ready to accept connections!');
}

bootstrap();
