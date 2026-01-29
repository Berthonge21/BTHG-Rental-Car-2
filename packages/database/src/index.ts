import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';

export { PrismaClient };

// Re-export for convenience
export type {
  Client,
  AgencyUser,
  Agency,
  Car,
  Parking,
  Rental,
  Maintenance,
  Availability,
  Notification,
} from '@prisma/client';
