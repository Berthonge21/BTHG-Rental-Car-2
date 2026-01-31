import type { PaginationQuery, Status } from './common';

// Agency DTOs
export interface CreateAgencyDto {
  name: string;
  address: string;
  email: string;
  telephone: string;
  responsibleId: number;
  image?: string;
}

export interface UpdateAgencyDto {
  name?: string;
  address?: string;
  email?: string;
  telephone?: string;
  image?: string;
  status?: Status;
}

export interface AgencyQueryDto extends PaginationQuery {
  status?: Status;
  search?: string;
}

// Response DTOs
export interface Agency {
  id: number;
  name: string;
  address: string;
  email: string;
  telephone: string;
  responsibleId: number;
  image?: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface AgencyStats {
  totalCars: number;
  availableCars: number;
  rentedCars: number;
  totalRentals: number;
  pendingRentals: number;
  activeRentals: number;
  totalRevenue: number;
}
