import { Module } from '@nestjs/common';
import { RentalsController } from './rentals.controller';
import { RentalsService } from './rentals.service';
import { RentalLifecycleService } from './rental-lifecycle.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RentalsController],
  providers: [RentalsService, RentalLifecycleService],
  exports: [RentalsService],
})
export class RentalsModule {}
