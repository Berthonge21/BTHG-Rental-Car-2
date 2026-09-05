import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCarDto, UpdateCarDto, CarQueryDto } from './dto';
import { createPaginationMeta } from '../../common/dto/pagination.dto';
import { Prisma } from '@rentalcar/database';

@Injectable()
export class CarsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: CarQueryDto, clientFacing = false) {
    const {
      page = 1,
      limit = 10,
      agencyId,
      brand,
      model,
      minPrice,
      maxPrice,
      fuel,
      gearBox,
      minYear,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.CarWhereInput = {
      deletedAt: null,
      ...(agencyId && { agencyId }),
      ...(brand && { brand: { contains: brand, mode: 'insensitive' } }),
      ...(model && { model: { contains: model, mode: 'insensitive' } }),
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
      ...(fuel && { fuel: { contains: fuel, mode: 'insensitive' } }),
      ...(gearBox && { gearBox: { contains: gearBox, mode: 'insensitive' } }),
      ...(minYear && { year: { gte: minYear } }),
      ...(clientFacing && { Agency: { status: 'activate', deletedAt: null } }),
    };

    const [cars, total] = await Promise.all([
      this.prisma.car.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Agency: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.car.count({ where }),
    ]);

    return {
      data: cars,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: number, clientFacing = false) {
    const car = await this.prisma.car.findFirst({
      where: { id, deletedAt: null },
      include: {
        Agency: {
          select: {
            id: true,
            name: true,
            telephone: true,
            email: true,
            status: true,
            deletedAt: true,
          },
        },
        parking: true,
      },
    });

    if (!car) {
      throw new NotFoundException(`Car with ID ${id} not found`);
    }

    if (clientFacing && (car.Agency.status === 'deactivate' || car.Agency.deletedAt)) {
      throw new NotFoundException(`Car with ID ${id} not found`);
    }

    return car;
  }

  async create(dto: CreateCarDto, userAgencyId?: number) {
    if (userAgencyId && dto.agencyId !== userAgencyId) {
      throw new ForbiddenException('You can only create cars for your own agency');
    }

    return this.prisma.car.create({
      data: dto,
      include: {
        Agency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async update(id: number, dto: UpdateCarDto, userAgencyId?: number) {
    const car = await this.findOne(id);

    if (userAgencyId && car.agencyId !== userAgencyId) {
      throw new ForbiddenException('You can only update cars from your own agency');
    }

    return this.prisma.car.update({
      where: { id },
      data: dto,
      include: {
        Agency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async remove(id: number, userAgencyId?: number) {
    const car = await this.findOne(id);

    if (userAgencyId && car.agencyId !== userAgencyId) {
      throw new ForbiddenException('You can only delete cars from your own agency');
    }

    const activeRental = await this.prisma.rental.findFirst({
      where: { carId: id, status: { in: ['reserved', 'ongoing'] } },
    });

    if (activeRental) {
      throw new ForbiddenException('Cannot delete a car with an active or reserved rental');
    }

    // Soft delete: Rental→Car is onDelete: Restrict specifically so a car
    // with rental history can never be hard-deleted (see AUDIT.md §9) —
    // "removing" a car now always means hiding it, never destroying the
    // row, so that history stays intact and the removal is reversible.
    return this.prisma.car.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async checkAvailability(id: number, startDate: string, endDate: string) {
    await this.findOne(id);

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check for conflicting rentals
    const conflictingRental = await this.prisma.rental.findFirst({
      where: {
        carId: id,
        status: { in: ['reserved', 'ongoing'] },
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
      },
    });

    // Check for manually blocked dates
    const blockedDates = await this.prisma.availability.findMany({
      where: {
        carId: id,
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    return {
      carId: id,
      available: !conflictingRental && blockedDates.length === 0,
      requestedDates: { startDate, endDate },
      ...(conflictingRental && { conflictingRental }),
      ...(blockedDates.length > 0 && { blockedDates: blockedDates.map((d) => d.date) }),
    };
  }

  /**
   * Get all blocked dates and rental dates for a car within a date range
   */
  async getAvailabilityCalendar(id: number, year: number, month?: number, userAgencyId?: number) {
    const car = await this.findOne(id);

    if (userAgencyId && car.agencyId !== userAgencyId) {
      throw new ForbiddenException('You can only view availability for your own cars');
    }

    // Determine date range (full year or specific month)
    const startDate = month
      ? new Date(year, month - 1, 1)
      : new Date(year, 0, 1);
    const endDate = month
      ? new Date(year, month, 0, 23, 59, 59)
      : new Date(year, 11, 31, 23, 59, 59);

    // Get manually blocked dates
    const blockedDates = await this.prisma.availability.findMany({
      where: {
        carId: id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Get rental dates (reserved or ongoing)
    const rentals = await this.prisma.rental.findMany({
      where: {
        carId: id,
        status: { in: ['reserved', 'ongoing'] },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
        client: {
          select: {
            id: true,
            firstname: true,
            name: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    // Calculate total available days in the period
    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

    // Calculate blocked days from rentals
    let rentalBlockedDays = 0;
    for (const rental of rentals) {
      const rentalStart = new Date(
        Math.max(rental.startDate.getTime(), startDate.getTime()),
      );
      const rentalEnd = new Date(
        Math.min(rental.endDate.getTime(), endDate.getTime()),
      );
      rentalBlockedDays +=
        Math.ceil(
          (rentalEnd.getTime() - rentalStart.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1;
    }

    const manuallyBlockedDays = blockedDates.length;
    const availableDays = totalDays - rentalBlockedDays - manuallyBlockedDays;

    return {
      carId: id,
      period: { year, month, startDate, endDate },
      stats: {
        totalDays,
        availableDays: Math.max(0, availableDays),
        rentalBlockedDays,
        manuallyBlockedDays,
      },
      blockedDates: blockedDates.map((d) => ({
        id: d.id,
        date: d.date,
        type: 'manual' as const,
      })),
      rentals: rentals.map((r) => ({
        id: r.id,
        startDate: r.startDate,
        endDate: r.endDate,
        status: r.status,
        client: r.client,
        type: 'rental' as const,
      })),
    };
  }

  /**
   * Block specific dates for a car
   */
  async blockDates(id: number, dates: string[], userAgencyId?: number) {
    const car = await this.findOne(id);

    if (userAgencyId && car.agencyId !== userAgencyId) {
      throw new ForbiddenException('You can only manage availability for your own cars');
    }

    const dateObjects = dates.map((d) => new Date(d));

    // Check if any dates have active rentals
    for (const date of dateObjects) {
      const conflictingRental = await this.prisma.rental.findFirst({
        where: {
          carId: id,
          status: { in: ['reserved', 'ongoing'] },
          startDate: { lte: date },
          endDate: { gte: date },
        },
      });

      if (conflictingRental) {
        throw new ForbiddenException(
          `Cannot block ${date.toISOString().split('T')[0]} - there's an active rental`,
        );
      }
    }

    // Create availability records (blocked dates)
    const created = await this.prisma.$transaction(
      dateObjects.map((date) =>
        this.prisma.availability.upsert({
          where: {
            carId_date: { carId: id, date },
          },
          create: { carId: id, date },
          update: {},
        }),
      ),
    );

    return {
      carId: id,
      blockedDates: created.map((d) => d.date),
      count: created.length,
    };
  }

  /**
   * Unblock specific dates for a car
   */
  async unblockDates(id: number, dates: string[], userAgencyId?: number) {
    const car = await this.findOne(id);

    if (userAgencyId && car.agencyId !== userAgencyId) {
      throw new ForbiddenException('You can only manage availability for your own cars');
    }

    const dateObjects = dates.map((d) => new Date(d));

    const deleted = await this.prisma.availability.deleteMany({
      where: {
        carId: id,
        date: { in: dateObjects },
      },
    });

    return {
      carId: id,
      unblockedCount: deleted.count,
    };
  }

  /**
   * Initialize availability for a new car (block no dates by default = all available)
   * Or block all dates except specified available days
   */
  async initializeAvailability(
    id: number,
    availableDays: number = 365,
    userAgencyId?: number,
  ) {
    const car = await this.findOne(id);

    if (userAgencyId && car.agencyId !== userAgencyId) {
      throw new ForbiddenException('You can only manage availability for your own cars');
    }

    // By default, all days are available (no blocked dates)
    // availableDays parameter is informational - actual availability is determined by
    // absence of blocked dates and rentals

    return {
      carId: id,
      message: `Car initialized with ${availableDays} days of availability`,
      availableDays,
    };
  }
}
