import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@rentalcar/database';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogEntry {
  actorId: number;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: number;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Answers "who did this" for privileged writes — before this, there was
 * no way to determine who cancelled a reservation or who changed an
 * agency's status. Deliberately fire-and-forget from the caller's point
 * of view: a logging failure must never fail the request it's describing,
 * so record() swallows its own errors after logging them.
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private prisma: PrismaService) {}

  async record(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({ data: entry });
    } catch (error) {
      this.logger.error(
        `Failed to write audit log entry for action "${entry.action}"`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
