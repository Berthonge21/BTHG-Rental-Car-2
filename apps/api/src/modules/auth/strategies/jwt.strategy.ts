import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  type: 'client' | 'agency';
  agencyId?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'default-secret',
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.type === 'client') {
      const client = await this.prisma.client.findUnique({
        where: { id: payload.sub },
      });

      if (!client) {
        throw new UnauthorizedException('User not found');
      }

      if (client.status === 'deactivate') {
        throw new UnauthorizedException('Account deactivated');
      }

      return {
        id: client.id,
        email: client.email,
        name: client.name,
        firstname: client.firstname,
        role: client.role,
        type: 'client',
      };
    } else {
      const agencyUser = await this.prisma.agencyUser.findUnique({
        where: { id: payload.sub },
      });

      if (!agencyUser) {
        throw new UnauthorizedException('User not found');
      }

      if (agencyUser.status === 'deactivate') {
        throw new UnauthorizedException('Account deactivated');
      }

      return {
        id: agencyUser.id,
        email: agencyUser.email,
        name: agencyUser.name,
        firstname: agencyUser.firstname,
        role: agencyUser.role,
        type: 'agency',
        agencyId: agencyUser.agencyId ?? undefined,
      };
    }
  }
}
