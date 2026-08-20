import { ConflictException } from '@nestjs/common';
import { Prisma } from '@rentalcar/database';

/**
 * Converts a Postgres foreign-key-violation (Prisma P2003) — e.g. deleting
 * a Car that still has Rentals, or an Agency that still has Cars — into a
 * clean 409 instead of letting it fall through to the global exception
 * filter's generic 500.
 */
export async function rejectOnForeignKeyViolation<T>(
  operation: () => Promise<T>,
  message: string,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      throw new ConflictException(message);
    }
    throw error;
  }
}
