import { Injectable, NotFoundException } from '@nestjs/common';
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
}
