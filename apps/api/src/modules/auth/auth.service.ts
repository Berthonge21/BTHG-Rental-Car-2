import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, AdminLoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async loginClient(dto: LoginDto) {
    const client = await this.prisma.client.findUnique({
      where: { email: dto.email },
    });

    if (!client) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, client.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(client, 'client');
  }

  async loginAdmin(dto: AdminLoginDto) {
    const agencyUser = await this.prisma.agencyUser.findUnique({
      where: { email: dto.email },
      include: { Agency: true },
    });

    if (!agencyUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, agencyUser.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(agencyUser, 'agency', agencyUser.Agency?.id);
  }

  async register(dto: RegisterDto) {
    const existingClient = await this.prisma.client.findUnique({
      where: { email: dto.email },
    });

    if (existingClient) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const client = await this.prisma.client.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
    });

    return {
      message: 'Registration successful',
      user: {
        id: client.id,
        email: client.email,
        name: client.name,
        firstname: client.firstname,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);

      if (payload.type === 'client') {
        const client = await this.prisma.client.findUnique({
          where: { id: payload.sub },
        });

        if (!client) {
          throw new UnauthorizedException('User not found');
        }

        return this.generateTokens(client, 'client');
      } else {
        const agencyUser = await this.prisma.agencyUser.findUnique({
          where: { id: payload.sub },
          include: { Agency: true },
        });

        if (!agencyUser) {
          throw new UnauthorizedException('User not found');
        }

        return this.generateTokens(agencyUser, 'agency', agencyUser.Agency?.id);
      }
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getMe(userId: number, type: 'client' | 'agency') {
    if (type === 'client') {
      const client = await this.prisma.client.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          firstname: true,
          telephone: true,
          address: true,
          city: true,
          image: true,
          role: true,
          createdAt: true,
        },
      });

      if (!client) {
        throw new UnauthorizedException('User not found');
      }

      return client;
    } else {
      const agencyUser = await this.prisma.agencyUser.findUnique({
        where: { id: userId },
        include: { Agency: true },
      });

      if (!agencyUser) {
        throw new UnauthorizedException('User not found');
      }

      return {
        id: agencyUser.id,
        email: agencyUser.email,
        name: agencyUser.name,
        firstname: agencyUser.firstname,
        role: agencyUser.role,
        image: agencyUser.image,
        agency: agencyUser.Agency
          ? {
              id: agencyUser.Agency.id,
              name: agencyUser.Agency.name,
            }
          : null,
      };
    }
  }

  private generateTokens(
    user: { id: number; email: string; name: string; firstname: string; role: string },
    type: 'client' | 'agency',
    agencyId?: number,
  ) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type,
      ...(agencyId && { agencyId }),
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstname: user.firstname,
        role: user.role,
        ...(agencyId && { agencyId }),
      },
    };
  }
}
