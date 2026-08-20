import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './prisma/prisma.module';
import { AuditLogModule } from './common/audit-log/audit-log.module';
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
    ScheduleModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: {
        // Structured JSON in prod/dev so logs are actually parseable by an
        // aggregator later; human-readable in local dev only. Silent under
        // Jest — pino-http logs every request/response by default, which
        // would otherwise bury the e2e suite's own output.
        level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
        transport:
          process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        // pino-http's default req/res serializers never include the
        // request or response body — only method/url/headers/status — so
        // the JWTs in login/refresh responses are never at risk here. The
        // one thing that does appear on every authenticated request is
        // the bearer token itself, in the Authorization header.
        redact: {
          paths: ['req.headers.authorization', 'req.headers.cookie'],
          censor: '[REDACTED]',
        },
      },
    }),
    PrismaModule,
    AuditLogModule,
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
