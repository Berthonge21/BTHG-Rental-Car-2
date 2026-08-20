import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RentalsService } from '../rentals/rentals.service';
import { RentalQueryDto } from '../rentals/dto';
import { RentalStatus } from '@rentalcar/database';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private rentalsService: RentalsService,
  ) {}

  async getDashboard(agencyId: number) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalCars,
      rentalCounts,
      totalRevenue,
      monthlyRevenue,
    ] = await Promise.all([
      this.prisma.car.count({ where: { agencyId } }),
      this.prisma.rental.groupBy({
        by: ['status'],
        where: { car: { agencyId } },
        _count: { _all: true },
      }),
      this.prisma.rental.aggregate({
        where: { car: { agencyId }, status: 'completed' },
        _sum: { total: true },
      }),
      this.prisma.rental.aggregate({
        where: {
          car: { agencyId },
          status: 'completed',
          endDate: { gte: startOfMonth },
        },
        _sum: { total: true },
      }),
    ]);

    const countFor = (status: RentalStatus) =>
      rentalCounts.find((r) => r.status === status)?._count._all ?? 0;
    const totalRentals = rentalCounts.reduce((sum, r) => sum + r._count._all, 0);
    const pendingRentals = countFor('reserved');
    const activeRentals = countFor('ongoing');
    const completedRentals = countFor('completed');

    return {
      totalCars,
      availableCars: totalCars - activeRentals,
      rentedCars: activeRentals,
      totalRentals,
      pendingRentals,
      activeRentals,
      completedRentals,
      totalRevenue: totalRevenue._sum.total || 0,
      monthlyRevenue: monthlyRevenue._sum.total || 0,
    };
  }

  async getRentals(agencyId: number, query: RentalQueryDto) {
    return this.rentalsService.findAllForAgency(agencyId, query);
  }

  async updateRentalStatus(
    rentalId: number,
    status: RentalStatus,
    agencyId: number,
  ) {
    return this.rentalsService.updateStatus(rentalId, status, agencyId);
  }

  async getRental(rentalId: number, agencyId?: number) {
    const rental = await this.prisma.rental.findUnique({
      where: { id: rentalId },
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
      throw new NotFoundException(`Rental with ID ${rentalId} not found`);
    }

    // If agencyId is provided, verify the rental belongs to that agency
    if (agencyId && rental.car.agencyId !== agencyId) {
      throw new ForbiddenException('You can only view rentals for your own agency');
    }

    return rental;
  }
}
