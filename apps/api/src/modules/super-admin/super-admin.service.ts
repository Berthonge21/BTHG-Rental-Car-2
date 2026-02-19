import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAdminUserDto, AssignAgencyDto, UpdateAdminStatusDto } from './dto';
import { RentalsService } from '../rentals/rentals.service';
import { RentalQueryDto } from '../rentals/dto';
import { createPaginationMeta } from '../../common/dto/pagination.dto';

@Injectable()
export class SuperAdminService {
  constructor(
    private prisma: PrismaService,
    private rentalsService: RentalsService,
  ) {}

  async getGlobalDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalAgencies,
      activeAgencies,
      totalCars,
      totalAdmins,
      totalClients,
      rentals,
      totalRevenue,
      monthlyRevenue,
    ] = await Promise.all([
      this.prisma.agency.count(),
      this.prisma.agency.count({ where: { status: 'activate' } }),
      this.prisma.car.count(),
      this.prisma.agencyUser.count(),
      this.prisma.client.count(),
      this.prisma.rental.findMany({ select: { status: true } }),
      this.prisma.rental.aggregate({
        where: { status: 'completed' },
        _sum: { total: true },
      }),
      this.prisma.rental.aggregate({
        where: {
          status: 'completed',
          endDate: { gte: startOfMonth },
        },
        _sum: { total: true },
      }),
    ]);

    return {
      totalAgencies,
      activeAgencies,
      totalCars,
      totalAdmins,
      totalClients,
      totalRentals: rentals.length,
      pendingRentals: rentals.filter((r) => r.status === 'reserved').length,
      activeRentals: rentals.filter((r) => r.status === 'ongoing').length,
      totalRevenue: totalRevenue._sum.total || 0,
      monthlyRevenue: monthlyRevenue._sum.total || 0,
    };
  }

  async getAllAgencies(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [agencies, total] = await Promise.all([
      this.prisma.agency.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          AgencyUser: {
            select: {
              id: true,
              name: true,
              firstname: true,
              email: true,
            },
          },
          _count: {
            select: {
              Cars: true,
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

  async getAllRentals(query: RentalQueryDto) {
    return this.rentalsService.findAll(query);
  }

  async createAdminUser(dto: CreateAdminUserDto) {
    const existingUser = await this.prisma.agencyUser.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    return this.prisma.agencyUser.create({
      data: {
        ...dto,
        password: hashedPassword,
        role: dto.role || 'admin',
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstname: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async assignAdminToAgency(userId: number, dto: AssignAgencyDto) {
    const user = await this.prisma.agencyUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Admin user with ID ${userId} not found`);
    }

    const agency = await this.prisma.agency.findUnique({
      where: { id: dto.agencyId },
    });

    if (!agency) {
      throw new NotFoundException(`Agency with ID ${dto.agencyId} not found`);
    }

    if (agency.responsibleId !== userId) {
      const existingAgency = await this.prisma.agency.findUnique({
        where: { responsibleId: userId },
      });

      if (existingAgency) {
        throw new BadRequestException(
          `This admin is already responsible for agency: ${existingAgency.name}`,
        );
      }

      return this.prisma.agency.update({
        where: { id: dto.agencyId },
        data: { responsibleId: userId },
        include: {
          AgencyUser: {
            select: {
              id: true,
              name: true,
              firstname: true,
              email: true,
            },
          },
        },
      });
    }

    return agency;
  }

  async updateAdminStatus(userId: number, dto: UpdateAdminStatusDto) {
    const user = await this.prisma.agencyUser.findUnique({
      where: { id: userId },
      include: { Agency: true },
    });

    if (!user) {
      throw new NotFoundException(`Admin user with ID ${userId} not found`);
    }

    if (user.role === 'superAdmin') {
      throw new BadRequestException('Cannot change status of a Super Admin');
    }

    if (dto.status === 'deactivate' && user.Agency) {
      const activeRentals = await this.prisma.rental.findFirst({
        where: {
          car: { agencyId: user.Agency.id },
          status: { in: ['reserved', 'ongoing'] },
        },
      });

      if (activeRentals) {
        throw new BadRequestException(
          'Cannot deactivate admin while their agency has active rentals',
        );
      }
    }

    const updatedUser = await this.prisma.agencyUser.update({
      where: { id: userId },
      data: {
        status: dto.status,
        deactivatedAt: dto.status === 'deactivate' ? null : null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstname: true,
        role: true,
        status: true,
        image: true,
        createdAt: true,
        Agency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Also update the agency status when deactivating/reactivating an admin
    if (updatedUser.Agency) {
      await this.prisma.agency.update({
        where: { id: updatedUser.Agency.id },
        data: {
          status: dto.status,
          updatedAt: new Date(),
        },
      });
    }

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      firstname: updatedUser.firstname,
      role: updatedUser.role,
      status: updatedUser.status,
      image: updatedUser.image,
      createdAt: updatedUser.createdAt,
      agencyId: updatedUser.Agency?.id || null,
      agencyName: updatedUser.Agency?.name || null,
      agency: updatedUser.Agency || null,
    };
  }

  async getAdminUsers(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.agencyUser.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          firstname: true,
          role: true,
          status: true,
          image: true,
          createdAt: true,
          Agency: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.agencyUser.count(),
    ]);

    // Transform to include agencyId and agencyName directly
    const transformedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      firstname: user.firstname,
      role: user.role,
      status: user.status,
      image: user.image,
      createdAt: user.createdAt,
      agencyId: user.Agency?.id || null,
      agencyName: user.Agency?.name || null,
      agency: user.Agency || null,
    }));

    return {
      data: transformedUsers,
      meta: createPaginationMeta(page, limit, total),
    };
  }
}
