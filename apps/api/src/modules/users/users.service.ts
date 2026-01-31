import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: number) {
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

  async updateProfile(userId: number, dto: UpdateProfileDto) {
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
