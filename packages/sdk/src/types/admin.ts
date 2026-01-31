import type { RentalStatus } from './common';

// Dashboard Stats
export interface DashboardStats {
  totalCars: number;
  availableCars: number;
  rentedCars: number;
  totalRentals: number;
  pendingRentals: number;
  activeRentals: number;
  completedRentals: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

// Update Rental Status DTO
export interface UpdateRentalStatusDto {
  status: RentalStatus;
}
