import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRentalDto, UpdateRentalDto, RentalQueryDto } from './dto';
import { createPaginationMeta } from '../../common/dto/pagination.dto';
import { assertValidRentalTransition } from '../../common/utils/rental-status';
import { Prisma, RentalStatus } from '@rentalcar/database';

@Injectable()
export class RentalsService {
  constructor(private prisma: PrismaService) {}

  async findAllForUser(userId: number, query: RentalQueryDto) {
    const { page = 1, limit = 10, status, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RentalWhereInput = {
      clientId: userId,
      ...(status && { status }),
      ...(startDate && { startDate: { gte: new Date(startDate) } }),
      ...(endDate && { endDate: { lte: new Date(endDate) } }),
    };

    const [rentals, total] = await Promise.all([
      this.prisma.rental.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
        include: {
          car: {
            select: {
              id: true,
              brand: true,
              model: true,
              year: true,
              image: true,
              price: true,
              Agency: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.rental.count({ where }),
    ]);

    return {
      data: rentals,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: number, userId?: number) {
    const rental = await this.prisma.rental.findUnique({
      where: { id },
      include: {
        car: {
          include: {
            Agency: {
              select: {
                id: true,
                name: true,
                telephone: true,
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            firstname: true,
            name: true,
            email: true,
            telephone: true,
          },
        },
      },
    });

    if (!rental) {
      throw new NotFoundException(`Rental with ID ${id} not found`);
    }

    if (userId && rental.clientId !== userId) {
      throw new ForbiddenException('You can only view your own rentals');
    }

    return rental;
  }

  async create(userId: number, dto: CreateRentalDto) {
    const car = await this.prisma.car.findUnique({
      where: { id: dto.carId },
    });

    if (!car) {
      throw new NotFoundException(`Car with ID ${dto.carId} not found`);
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    if (startDate < new Date()) {
      throw new BadRequestException('Start date must be in the future');
    }

    // Price is always computed server-side from the car's rate — a client
    // can influence which car and dates it books, never what it pays.
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const total = car.price * days;

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const conflictingRental = await tx.rental.findFirst({
            where: {
              carId: dto.carId,
              status: { in: ['reserved', 'ongoing'] },
              startDate: { lte: endDate },
              endDate: { gte: startDate },
            },
          });

          if (conflictingRental) {
            throw new ConflictException('Car is not available for the selected dates');
          }

          return tx.rental.create({
            data: {
              clientId: userId,
              carId: dto.carId,
              startDate,
              endDate,
              startTime: new Date(dto.startTime),
              endTime: new Date(dto.endTime),
              total,
              status: 'reserved',
            },
            include: {
              car: {
                select: {
                  id: true,
                  brand: true,
                  model: true,
                  year: true,
                  image: true,
                  price: true,
                },
              },
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      // Serializable isolation surfaces a real concurrent conflict as a
      // transaction-level error (Prisma P2034); the GiST exclusion
      // constraint on Rental (see the database migrations) is the
      // authoritative backstop and surfaces as a raw Postgres 23P01. Both
      // mean the same thing to the caller: the slot was taken by a
      // concurrent request, so retry.
      if (
        error instanceof ConflictException ||
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') ||
        (error instanceof Prisma.PrismaClientUnknownRequestError &&
          error.message.includes('23P01'))
      ) {
        throw new ConflictException(
          'Car is not available for the selected dates — please try again',
        );
      }
      throw error;
    }
  }

  async update(id: number, userId: number, dto: UpdateRentalDto) {
    const rental = await this.findOne(id, userId);

    if (dto.status) {
      // A client-initiated status change is only ever a cancellation —
      // marking a rental 'ongoing' or 'completed' is an operational
      // decision made by the agency/system, not something the person who
      // booked it gets to declare about their own rental.
      if (dto.status !== 'cancelled') {
        throw new ForbiddenException('Clients may only cancel their own rentals');
      }
      assertValidRentalTransition(rental.status, dto.status);
    }

    return this.prisma.rental.update({
      where: { id },
      data: dto,
      include: {
        car: {
          select: {
            id: true,
            brand: true,
            model: true,
            year: true,
            image: true,
            price: true,
          },
        },
      },
    });
  }

  async cancel(id: number, userId: number) {
    const rental = await this.findOne(id, userId);

    assertValidRentalTransition(rental.status, 'cancelled');

    return this.prisma.rental.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }

  async findAllForAgency(agencyId: number, query: RentalQueryDto) {
    const { page = 1, limit = 10, status, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RentalWhereInput = {
      car: { agencyId },
      ...(status && { status }),
      ...(startDate && { startDate: { gte: new Date(startDate) } }),
      ...(endDate && { endDate: { lte: new Date(endDate) } }),
    };

    const [rentals, total] = await Promise.all([
      this.prisma.rental.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
        include: {
          car: {
            select: {
              id: true,
              brand: true,
              model: true,
              year: true,
              image: true,
              price: true,
            },
          },
          client: {
            select: {
              id: true,
              firstname: true,
              name: true,
              email: true,
              telephone: true,
            },
          },
        },
      }),
      this.prisma.rental.count({ where }),
    ]);

    return {
      data: rentals,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  async findAll(query: RentalQueryDto) {
    const { page = 1, limit = 10, status, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RentalWhereInput = {
      ...(status && { status }),
      ...(startDate && { startDate: { gte: new Date(startDate) } }),
      ...(endDate && { endDate: { lte: new Date(endDate) } }),
    };

    const [rentals, total] = await Promise.all([
      this.prisma.rental.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
        include: {
          car: {
            include: {
              Agency: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          client: {
            select: {
              id: true,
              firstname: true,
              name: true,
              email: true,
              telephone: true,
            },
          },
        },
      }),
      this.prisma.rental.count({ where }),
    ]);

    return {
      data: rentals,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  async updateStatus(id: number, status: RentalStatus, agencyId?: number) {
    const rental = await this.prisma.rental.findUnique({
      where: { id },
      include: { car: true },
    });

    if (!rental) {
      throw new NotFoundException(`Rental with ID ${id} not found`);
    }

    if (agencyId && rental.car.agencyId !== agencyId) {
      throw new ForbiddenException('You can only update rentals for your own agency');
    }

    assertValidRentalTransition(rental.status, status);

    return this.prisma.rental.update({
      where: { id },
      data: { status },
      include: {
        car: {
          select: {
            id: true,
            brand: true,
            model: true,
          },
        },
        client: {
          select: {
            id: true,
            firstname: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
