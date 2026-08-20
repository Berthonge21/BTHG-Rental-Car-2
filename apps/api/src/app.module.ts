import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AgenciesModule } from './modules/agencies/agencies.module';
import { CarsModule } from './modules/cars/cars.module';
import { RentalsModule } from './modules/rentals/rentals.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['../../.env', '.env', '.env.local'],
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          // Global default: generous enough not to bother normal usage.
          // /auth/* routes override this with a much tighter limit — see
          // AuthController.
          name: 'default',
          ttl: 60_000,
          limit: 100,
        },
      ],
      // Rate limiting is a real, load-bearing security control in
      // production; it should not be watered down for tests. Instead,
      // e2e specs exercise real request volume against a real database
      // (multiple logins, cross-tenant attempts, etc.) where hitting a
      // *security* limit would be a false failure unrelated to what the
      // test is actually verifying — so it's skipped only under Jest,
      // never in dev or prod.
      skipIf: () => process.env.NODE_ENV === 'test',
    }),
    PrismaModule,
    AuthModule,
    AgenciesModule,
    CarsModule,
    RentalsModule,
    UsersModule,
    AdminModule,
    SuperAdminModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
