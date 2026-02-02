import type { PaginationQuery } from './common';

// Car DTOs
export interface CreateCarDto {
  agencyId: number;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  registration: string;
  fuel: string;
  door: number;
  gearBox: string;
  parkingId?: number;
  description?: string;
  image?: string;
}

export interface UpdateCarDto {
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  price?: number;
  registration?: string;
  fuel?: string;
  door?: number;
  gearBox?: string;
  parkingId?: number;
  description?: string;
  image?: string;
}

export interface CarQueryDto extends PaginationQuery {
  agencyId?: number;
  brand?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  fuel?: string;
  gearBox?: string;
  minYear?: number;
}

// Response DTOs
export interface CarAgency {
  id: number;
  name: string;
}

export interface Car {
  id: number;
  agencyId: number;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  registration: string;
  fuel: string;
  door: number;
  gearBox: string;
  description?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  Agency?: CarAgency;
}

export interface CarAvailability {
  carId: number;
  available: boolean;
  requestedDates: {
    startDate: string;
    endDate: string;
  };
  conflictingRental?: {
    id: number;
    startDate: string;
    endDate: string;
  };
  blockedDates?: string[];
}

export interface BlockedDate {
  id: number;
  date: string;
  type: 'manual';
}

export interface RentalBlock {
  id: number;
  startDate: string;
  endDate: string;
  status: string;
  client: {
    id: number;
    firstname: string;
    name: string;
  };
  type: 'rental';
}

export interface CarAvailabilityCalendar {
  carId: number;
  period: {
    year: number;
    month?: number;
    startDate: string;
    endDate: string;
  };
  stats: {
    totalDays: number;
    availableDays: number;
    rentalBlockedDays: number;
    manuallyBlockedDays: number;
  };
  blockedDates: BlockedDate[];
  rentals: RentalBlock[];
}

export interface BlockDatesResponse {
  carId: number;
  blockedDates: string[];
  count: number;
}

export interface UnblockDatesResponse {
  carId: number;
  unblockedCount: number;
}
