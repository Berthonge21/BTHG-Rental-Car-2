// Enums
export enum UserRole {
  ADMIN = 'admin',
  SUPER_ADMIN = 'superAdmin',
}

export enum ClientRole {
  USER = 'user',
}

export enum RentalStatus {
  RESERVED = 'reserved',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum Status {
  ACTIVATE = 'activate',
  DEACTIVATE = 'deactivate',
}

// Pagination
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Message response
export interface MessageResponse {
  message: string;
}
