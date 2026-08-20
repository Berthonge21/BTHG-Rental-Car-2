import { ForbiddenException } from '@nestjs/common';

export interface TenantScopedUser {
  role: string;
  agencyId?: number;
}

/**
 * Resolves the acting user's tenant scope for an agency-scoped operation.
 *
 * Returns `undefined` only for a superAdmin, meaning "no restriction."
 * For every other role, a missing `agencyId` is a rejection, not an
 * unrestricted scope — `undefined` must never mean two different things
 * to the caller. Services that receive this value can treat `undefined`
 * as "superAdmin, proceed unscoped" unconditionally, with no further
 * truthiness check needed at the call site.
 */
export function requireTenantScope(user: TenantScopedUser): number | undefined {
  if (user.role === 'superAdmin') {
    return undefined;
  }

  if (!user.agencyId) {
    throw new ForbiddenException('Your account has no assigned agency');
  }

  return user.agencyId;
}
