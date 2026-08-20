import type { PaginationQuery, RentalStatus } from './common';

// Rental DTOs
export interface CreateRentalDto {
  carId: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}

export interface UpdateRentalDto {
  status?: RentalStatus;
}

export interface RentalQueryDto extends PaginationQuery {
  status?: RentalStatus;
  startDate?: string;
  endDate?: string;
}

// Response DTOs
export interface RentalCar {
  id: number;
  brand: string;
  model: string;
  year: number;
  image?: string;
  price: number;
}

export interface RentalClient {
  id: number;
  firstname: string;
  name: string;
  email: string;
  telephone: string;
}

export interface Rental {
  id: number;
  clientId: number;
  carId: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  total: number;
  status: RentalStatus;
  car?: RentalCar;
  client?: RentalClient;
}
