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
import { RentalStatus } from '@rentalcar/database';
import { AuditLogService } from '../../common/audit-log/audit-log.service';

@Injectable()
export class SuperAdminService {
  constructor(
    private prisma: PrismaService,
    private rentalsService: RentalsService,
    private auditLog: AuditLogService,
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
      rentalCounts,
      totalRevenue,
      monthlyRevenue,
    ] = await Promise.all([
      this.prisma.agency.count(),
      this.prisma.agency.count({ where: { status: 'activate' } }),
      this.prisma.car.count(),
      this.prisma.agencyUser.count(),
      this.prisma.client.count(),
      this.prisma.rental.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
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

    const countFor = (status: RentalStatus) =>
      rentalCounts.find((r) => r.status === status)?._count._all ?? 0;
    const totalRentals = rentalCounts.reduce((sum, r) => sum + r._count._all, 0);

    return {
      totalAgencies,
      activeAgencies,
      totalCars,
      totalAdmins,
      totalClients,
      totalRentals,
      pendingRentals: countFor('reserved'),
      activeRentals: countFor('ongoing'),
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

    const role = dto.role || 'admin';

    if (role === 'superAdmin') {
      if (dto.agencyId) {
        throw new BadRequestException('A Super Admin cannot be assigned to an agency');
      }
    } else {
      if (!dto.agencyId) {
        throw new BadRequestException(
          'agencyId is required to create an admin — without one they cannot access any agency-scoped resource',
        );
      }

      const agency = await this.prisma.agency.findUnique({
        where: { id: dto.agencyId },
      });

      if (!agency) {
        throw new NotFoundException(`Agency with ID ${dto.agencyId} not found`);
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    return this.prisma.agencyUser.create({
      data: {
        name: dto.name,
        firstname: dto.firstname,
        email: dto.email,
        password: hashedPassword,
        image: dto.image,
        role,
        agencyId: role === 'superAdmin' ? null : dto.agencyId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstname: true,
        role: true,
        status: true,
        createdAt: true,
        agencyId: true,
        Agency: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Adds an admin as a staff member of an agency (AgencyUser.agencyId).
   * This is deliberately independent of Agency.responsibleId, which
   * remains a separate, still-1:1 "primary contact" concept set at
   * agency creation — an agency can have many staff admins via this
   * endpoint, only one of which is ever its formal Responsible.
   */
  async assignAdminToAgency(
    userId: number,
    dto: AssignAgencyDto,
    actor: { id: number; email: string },
  ) {
    const user = await this.prisma.agencyUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Admin user with ID ${userId} not found`);
    }

    if (user.role === 'superAdmin') {
      throw new BadRequestException('Cannot assign an agency to a Super Admin');
    }

    const agency = await this.prisma.agency.findUnique({
      where: { id: dto.agencyId },
    });

    if (!agency) {
      throw new NotFoundException(`Agency with ID ${dto.agencyId} not found`);
    }

    const updated = await this.prisma.agencyUser.update({
      where: { id: userId },
      data: { agencyId: dto.agencyId },
      select: {
        id: true,
        email: true,
        name: true,
        firstname: true,
        role: true,
        status: true,
        deactivatedAt: true,
        image: true,
        createdAt: true,
        Agency: { select: { id: true, name: true } },
      },
    });

    await this.auditLog.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'admin.agency_assigned',
      targetType: 'AgencyUser',
      targetId: userId,
      metadata: { previousAgencyId: user.agencyId, newAgencyId: dto.agencyId },
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      firstname: updated.firstname,
      role: updated.role,
      status: updated.status,
      deactivatedAt: updated.deactivatedAt,
      image: updated.image,
      createdAt: updated.createdAt,
      agencyId: updated.Agency?.id || null,
      agencyName: updated.Agency?.name || null,
      agency: updated.Agency || null,
    };
  }

  async updateAdminStatus(
    userId: number,
    dto: UpdateAdminStatusDto,
    actor: { id: number; email: string },
  ) {
    const user = await this.prisma.agencyUser.findUnique({
      where: { id: userId },
      // ResponsibleOf, not Agency: whether deactivating this admin cascades
      // to their agency's status is specifically about being the formal
      // responsible contact, not general staff membership — an agency can
      // now have several staff admins, and deactivating one of them should
      // not deactivate the whole agency.
      include: { ResponsibleOf: true },
    });

    if (!user) {
      throw new NotFoundException(`Admin user with ID ${userId} not found`);
    }

    if (user.role === 'superAdmin') {
      throw new BadRequestException('Cannot change status of a Super Admin');
    }

    if (dto.status === 'deactivate' && user.ResponsibleOf) {
      const activeRentals = await this.prisma.rental.findFirst({
        where: {
          car: { agencyId: user.ResponsibleOf.id },
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
        ResponsibleOf: {
          select: { id: true },
        },
      },
    });

    await this.auditLog.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'admin.status_changed',
      targetType: 'AgencyUser',
      targetId: userId,
      metadata: { previousStatus: user.status, newStatus: dto.status },
    });

    // Cascade to the agency's own status only when this admin is its
    // formal responsible contact — see the comment above.
    if (updatedUser.ResponsibleOf) {
      await this.prisma.agency.update({
        where: { id: updatedUser.ResponsibleOf.id },
        data: {
          status: dto.status,
          updatedAt: new Date(),
        },
      });

      await this.auditLog.record({
        actorId: actor.id,
        actorEmail: actor.email,
        action: 'agency.status_changed',
        targetType: 'Agency',
        targetId: updatedUser.ResponsibleOf.id,
        metadata: { newStatus: dto.status, cause: 'responsible_admin_status_change', causedBy: userId },
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

  async getAdminUser(id: number) {
    const user = await this.prisma.agencyUser.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        firstname: true,
        role: true,
        status: true,
        deactivatedAt: true,
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

    if (!user) {
      throw new NotFoundException(`Admin user with ID ${id} not found`);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      firstname: user.firstname,
      role: user.role,
      status: user.status,
      deactivatedAt: user.deactivatedAt,
      image: user.image,
      createdAt: user.createdAt,
      agencyId: user.Agency?.id || null,
      agencyName: user.Agency?.name || null,
      agency: user.Agency || null,
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
          deactivatedAt: true,
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
      deactivatedAt: user.deactivatedAt,
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
