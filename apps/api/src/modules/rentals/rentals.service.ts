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
import { Prisma } from '@automobelite/database';

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

    const conflictingRental = await this.prisma.rental.findFirst({
      where: {
        carId: dto.carId,
        status: { in: ['reserved', 'ongoing'] },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    if (conflictingRental) {
      throw new ConflictException('Car is not available for the selected dates');
    }

    // Calculate total if not provided (price per day * number of days)
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const total = dto.total ?? car.price * days;

    return this.prisma.rental.create({
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
  }

  async update(id: number, userId: number, dto: UpdateRentalDto) {
    const rental = await this.findOne(id, userId);

    if (rental.status !== 'reserved' && dto.status) {
      throw new BadRequestException('Only reserved rentals can be modified by users');
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

    if (rental.status === 'completed' || rental.status === 'cancelled') {
      throw new BadRequestException('Cannot cancel a completed or already cancelled rental');
    }

    if (rental.status === 'ongoing') {
      throw new BadRequestException('Cannot cancel an ongoing rental');
    }

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

  async updateStatus(id: number, status: string, agencyId?: number) {
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

    return this.prisma.rental.update({
      where: { id },
      data: { status: status as any },
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
