import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Bthg RentalCar API')
    .setDescription(
      'The Bthg RentalCar platform API documentation. ' +
        'This API provides endpoints for managing agencies, cars, clients, and rentals.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health', 'Health check endpoints')
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Agencies', 'Agency management endpoints')
    .addTag('Cars', 'Car management endpoints')
    .addTag('Clients', 'Client management endpoints')
    .addTag('Rentals', 'Rental/Reservation endpoints')
    .addTag('Parkings', 'Parking management endpoints')
    .addTag('Notifications', 'Notification endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Automobelite API Docs',
  });
}
