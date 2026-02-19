import type { Status } from './common';

// User Profile DTOs
export interface UpdateProfileDto {
  firstname?: string;
  name?: string;
  telephone?: string;
  address?: string;
  city?: string;
  image?: string;
}

export interface UserProfile {
  id: number;
  email: string;
  firstname: string;
  name: string;
  telephone: string;
  address: string;
  city: string;
  image?: string;
  role: string;
  status: Status;
  deactivatedAt: string | null;
  createdAt: string;
}

// Deactivation error response (returned on login when account is deactivated)
export interface DeactivationErrorResponse {
  message: string;
  statusCode: number;
  code: 'ACCOUNT_DEACTIVATED';
  selfDeactivated: boolean;
}
