import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAgencyDto, UpdateAgencyDto } from './dto';
import { createPaginationMeta } from '../../common/dto/pagination.dto';
import { RentalStatus } from '@rentalcar/database';
import { AuditLogService } from '../../common/audit-log/audit-log.service';

@Injectable()
export class AgenciesService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [agencies, total] = await Promise.all([
      this.prisma.agency.findMany({
        where: { deletedAt: null },
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
      this.prisma.agency.count({ where: { deletedAt: null } }),
    ]);

    return {
      data: agencies,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: number) {
    const agency = await this.prisma.agency.findFirst({
      where: { id, deletedAt: null },
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

  async update(id: number, dto: UpdateAgencyDto, actor: { id: number; email: string }) {
    const existing = await this.findOne(id);

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

    const updated = await this.prisma.agency.update({
      where: { id },
      data: dto,
    });

    if (dto.status && dto.status !== existing.status) {
      await this.auditLog.record({
        actorId: actor.id,
        actorEmail: actor.email,
        action: 'agency.status_changed',
        targetType: 'Agency',
        targetId: id,
        metadata: { previousStatus: existing.status, newStatus: dto.status },
      });
    }

    return updated;
  }

  async remove(id: number) {
    await this.findOne(id);

    // Soft delete: Car→Agency stays Restrict at the DB level, so an
    // agency with any (non-deleted) cars still can't be hard-deleted —
    // but staff (AgencyUser→Agency) is ON DELETE SET NULL, so a hard
    // delete would silently orphan every admin at that agency instead of
    // being blocked. Soft delete sidesteps that entirely: the agency
    // record — and its staff's agencyId — stay intact and reversible.
    return this.prisma.agency.update({
      where: { id },
      // Also deactivate: a deleted agency must never still read as
      // 'activate' to the parts of the app (the public car catalogue,
      // notably) that only check status and don't know about deletedAt.
      data: { deletedAt: new Date(), status: 'deactivate' },
    });
  }

  async getCars(id: number, page = 1, limit = 10) {
    await this.findOne(id);

    const skip = (page - 1) * limit;

    const [cars, total] = await Promise.all([
      this.prisma.car.findMany({
        where: { agencyId: id, deletedAt: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.car.count({ where: { agencyId: id, deletedAt: null } }),
    ]);

    return {
      data: cars,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  async getStats(id: number) {
    await this.findOne(id);

    const [totalCars, rentalCounts, revenue] = await Promise.all([
      this.prisma.car.count({ where: { agencyId: id, deletedAt: null } }),
      this.prisma.rental.groupBy({
        by: ['status'],
        where: { car: { agencyId: id } },
        _count: { _all: true },
      }),
      this.prisma.rental.aggregate({
        where: { car: { agencyId: id }, status: 'completed' },
        _sum: { total: true },
      }),
    ]);

    const countFor = (status: RentalStatus) =>
      rentalCounts.find((r) => r.status === status)?._count._all ?? 0;
    const totalRentals = rentalCounts.reduce((sum, r) => sum + r._count._all, 0);
    const pendingRentals = countFor('reserved');
    const activeRentals = countFor('ongoing');

    return {
      totalCars,
      availableCars: totalCars - activeRentals,
      rentedCars: activeRentals,
      totalRentals,
      pendingRentals,
      activeRentals,
      totalRevenue: revenue._sum.total || 0,
    };
  }
}
