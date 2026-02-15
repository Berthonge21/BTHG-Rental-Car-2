import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: number, userType: 'client' | 'agency' = 'client') {
    if (userType === 'agency') {
      const user = await this.prisma.agencyUser.findUnique({
        where: { id: userId },
        include: { Agency: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        name: user.name,
        image: user.image,
        role: user.role,
        createdAt: user.createdAt,
        agency: user.Agency
          ? { id: user.Agency.id, name: user.Agency.name }
          : null,
      };
    }

    const user = await this.prisma.client.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstname: true,
        name: true,
        telephone: true,
        address: true,
        city: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
    userType: 'client' | 'agency' = 'client',
  ) {
    if (userType === 'agency') {
      const user = await this.prisma.agencyUser.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const updated = await this.prisma.agencyUser.update({
        where: { id: userId },
        data: {
          firstname: dto.firstname,
          name: dto.name,
          image: dto.image,
          updatedAt: new Date(),
        },
        include: { Agency: true },
      });

      return {
        id: updated.id,
        email: updated.email,
        firstname: updated.firstname,
        name: updated.name,
        image: updated.image,
        role: updated.role,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        agency: updated.Agency
          ? { id: updated.Agency.id, name: updated.Agency.name }
          : null,
      };
    }

    const user = await this.prisma.client.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.client.update({
      where: { id: userId },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstname: true,
        name: true,
        telephone: true,
        address: true,
        city: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deactivateAccount(userId: number, userType: 'client' | 'agency') {
    if (userType === 'client') {
      const activeRentals = await this.prisma.rental.findFirst({
        where: {
          clientId: userId,
          status: { in: ['reserved', 'ongoing'] },
        },
      });

      if (activeRentals) {
        throw new BadRequestException(
          'Cannot deactivate account with active rentals',
        );
      }

      await this.prisma.client.update({
        where: { id: userId },
        data: {
          status: 'deactivate',
          deactivatedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return { message: 'Account deactivated successfully' };
    }

    const agencyUser = await this.prisma.agencyUser.findUnique({
      where: { id: userId },
      include: { Agency: true },
    });

    if (!agencyUser) {
      throw new NotFoundException('User not found');
    }

    if (agencyUser.Agency) {
      const activeRentals = await this.prisma.rental.findFirst({
        where: {
          car: { agencyId: agencyUser.Agency.id },
          status: { in: ['reserved', 'ongoing'] },
        },
      });

      if (activeRentals) {
        throw new BadRequestException(
          'Cannot deactivate account while your agency has active rentals',
        );
      }
    }

    await this.prisma.agencyUser.update({
      where: { id: userId },
      data: {
        status: 'deactivate',
        deactivatedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return { message: 'Account deactivated successfully' };
  }
}
