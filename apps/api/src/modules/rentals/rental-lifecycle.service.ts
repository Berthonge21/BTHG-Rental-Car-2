import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Nothing in the platform ever moved a rental from 'ongoing' to
 * 'completed' on its own — a booking that ran past its endDate stayed
 * 'ongoing' forever unless an admin noticed and updated it by hand. This
 * closes that gap: an hourly sweep advances any 'ongoing' rental whose
 * endDate has passed, using the same transition the admin-initiated path
 * already goes through (rentals.service.ts's updateStatus), so both go
 * through the identical status write.
 */
@Injectable()
export class RentalLifecycleService {
  private readonly logger = new Logger(RentalLifecycleService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async completePastDueRentals(): Promise<void> {
    const { count } = await this.prisma.rental.updateMany({
      where: {
        status: 'ongoing',
        endDate: { lt: new Date() },
      },
      data: {
        status: 'completed',
      },
    });

    if (count > 0) {
      this.logger.log(`Auto-completed ${count} past-due rental(s)`);
    }
  }
}
