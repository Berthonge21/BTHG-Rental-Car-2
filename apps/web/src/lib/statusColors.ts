import type { RentalStatus, Status, UserRole } from '@bthgrentalcar/sdk';

// Single source of truth for status/role -> Chakra colorScheme, replacing
// the same three mappings that were independently redeclared across ~10
// pages. Update once here, not once per page.

export const rentalStatusColors: Record<RentalStatus, string> = {
  reserved: 'yellow',
  ongoing: 'blue',
  completed: 'green',
  cancelled: 'red',
};

export const activationStatusColors: Record<Status, string> = {
  activate: 'green',
  deactivate: 'red',
};

export const roleColors: Record<UserRole, string> = {
  admin: 'blue',
  superAdmin: 'purple',
};
