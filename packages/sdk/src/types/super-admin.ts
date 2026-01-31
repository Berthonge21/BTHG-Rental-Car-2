import type { PaginationQuery, UserRole } from './common';

// Create Admin User DTO
export interface CreateAdminUserDto {
  firstname: string;
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  image?: string;
}

// Assign Agency DTO
export interface AssignAgencyDto {
  agencyId: number;
}

// Global Stats
export interface GlobalStats {
  totalAgencies: number;
  activeAgencies: number;
  totalCars: number;
  totalAdmins: number;
  totalClients: number;
  totalRentals: number;
  pendingRentals: number;
  activeRentals: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

// Admin User
export interface AdminUser {
  id: number;
  firstname: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string;
  agencyId?: number;
  agencyName?: string;
  createdAt: string;
}

export interface AdminUserQueryDto extends PaginationQuery {
  role?: UserRole;
  search?: string;
}
