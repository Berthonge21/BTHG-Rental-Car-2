import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAgencyDto, UpdateAgencyDto } from './dto';
import { createPaginationMeta } from '../../common/dto/pagination.dto';

@Injectable()
export class AgenciesService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [agencies, total] = await Promise.all([
      this.prisma.agency.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          // Public endpoint — deliberately excludes AgencyUser.email. That
          // is the admin's login credential, not agency contact info
          // (Agency.email, above, is the public contact address); exposing
          // it here would hand out a ready-made list of valid login
          // identifiers to target.
          AgencyUser: {
            select: {
              id: true,
              name: true,
              firstname: true,
            },
          },
        },
      }),
      this.prisma.agency.count(),
    ]);

    return {
      data: agencies,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: number) {
    const agency = await this.prisma.agency.findUnique({
      where: { id },
      include: {
        // Public endpoint — deliberately excludes AgencyUser.email. That
        // is the admin's login credential, not agency contact info
        // (Agency.email, above, is the public contact address); exposing
        // it here would hand out a ready-made list of valid login
        // identifiers to target.
        AgencyUser: {
          select: {
            id: true,
            name: true,
            firstname: true,
          },
        },
        _count: {
          select: {
            Cars: true,
            Parking: true,
          },
        },
      },
    });

    if (!agency) {
      throw new NotFoundException(`Agency with ID ${id} not found`);
    }

    return agency;
  }

  async create(dto: CreateAgencyDto) {
    const existingByName = await this.prisma.agency.findUnique({
      where: { name: dto.name },
    });

    if (existingByName) {
      throw new ConflictException('Agency with this name already exists');
    }

    const existingByEmail = await this.prisma.agency.findUnique({
      where: { email: dto.email },
    });

    if (existingByEmail) {
      throw new ConflictException('Agency with this email already exists');
    }

    return this.prisma.agency.create({
      data: dto,
      include: {
        // Public endpoint — deliberately excludes AgencyUser.email. That
        // is the admin's login credential, not agency contact info
        // (Agency.email, above, is the public contact address); exposing
        // it here would hand out a ready-made list of valid login
        // identifiers to target.
        AgencyUser: {
          select: {
            id: true,
            name: true,
            firstname: true,
          },
        },
      },
    });
  }

  async update(id: number, dto: UpdateAgencyDto) {
    await this.findOne(id);

    if (dto.name) {
      const existingByName = await this.prisma.agency.findFirst({
        where: { name: dto.name, NOT: { id } },
      });

      if (existingByName) {
        throw new ConflictException('Agency with this name already exists');
      }
    }

    if (dto.email) {
      const existingByEmail = await this.prisma.agency.findFirst({
        where: { email: dto.email, NOT: { id } },
      });

      if (existingByEmail) {
        throw new ConflictException('Agency with this email already exists');
      }
    }

    return this.prisma.agency.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.agency.delete({
      where: { id },
    });
  }

  async getCars(id: number, page = 1, limit = 10) {
    await this.findOne(id);

    const skip = (page - 1) * limit;

    const [cars, total] = await Promise.all([
      this.prisma.car.findMany({
        where: { agencyId: id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.car.count({ where: { agencyId: id } }),
    ]);

    return {
      data: cars,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  async getStats(id: number) {
    await this.findOne(id);

    const [totalCars, rentals, revenue] = await Promise.all([
      this.prisma.car.count({ where: { agencyId: id } }),
      this.prisma.rental.findMany({
        where: { car: { agencyId: id } },
        select: { status: true, total: true },
      }),
      this.prisma.rental.aggregate({
        where: { car: { agencyId: id }, status: 'completed' },
        _sum: { total: true },
      }),
    ]);

    const pendingRentals = rentals.filter((r) => r.status === 'reserved').length;
    const activeRentals = rentals.filter((r) => r.status === 'ongoing').length;

    return {
      totalCars,
      availableCars: totalCars - activeRentals,
      rentedCars: activeRentals,
      totalRentals: rentals.length,
      pendingRentals,
      activeRentals,
      totalRevenue: revenue._sum.total || 0,
    };
  }
}
