import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCarDto, UpdateCarDto, CarQueryDto } from './dto';
import { createPaginationMeta } from '../../common/dto/pagination.dto';
import { Prisma } from '@automobelite/database';

@Injectable()
export class CarsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: CarQueryDto) {
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
      ...(agencyId && { agencyId }),
      ...(brand && { brand: { contains: brand, mode: 'insensitive' } }),
      ...(model && { model: { contains: model, mode: 'insensitive' } }),
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
      ...(fuel && { fuel: { contains: fuel, mode: 'insensitive' } }),
      ...(gearBox && { gearBox: { contains: gearBox, mode: 'insensitive' } }),
      ...(minYear && { year: { gte: minYear } }),
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

  async findOne(id: number) {
    const car = await this.prisma.car.findUnique({
      where: { id },
      include: {
        Agency: {
          select: {
            id: true,
            name: true,
            telephone: true,
            email: true,
          },
        },
        parking: true,
      },
    });

    if (!car) {
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

    return this.prisma.car.delete({
      where: { id },
    });
  }

  async checkAvailability(id: number, startDate: string, endDate: string) {
    const car = await this.findOne(id);

    const start = new Date(startDate);
    const end = new Date(endDate);

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

    return {
      carId: id,
      available: !conflictingRental,
      requestedDates: { startDate, endDate },
      ...(conflictingRental && { conflictingRental }),
    };
  }
}
