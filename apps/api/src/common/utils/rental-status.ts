import { BadRequestException } from '@nestjs/common';
import { RentalStatus } from '@rentalcar/database';

// The only transitions the rental lifecycle actually permits:
// reserved → ongoing → completed, and reserved → cancelled. Every other
// move (including no-ops and moving backwards) is rejected.
const ALLOWED_TRANSITIONS: Record<RentalStatus, RentalStatus[]> = {
  reserved: ['ongoing', 'cancelled'],
  ongoing: ['completed'],
  completed: [],
  cancelled: [],
};

export function assertValidRentalTransition(current: RentalStatus, next: RentalStatus): void {
  if (!ALLOWED_TRANSITIONS[current].includes(next)) {
    throw new BadRequestException(`Cannot move a rental from '${current}' to '${next}'`);
  }
}
