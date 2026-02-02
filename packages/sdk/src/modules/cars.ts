import type { AxiosInstance } from 'axios';
import type {
  Car,
  CarQueryDto,
  CreateCarDto,
  UpdateCarDto,
  CarAvailability,
  CarAvailabilityCalendar,
  BlockDatesResponse,
  UnblockDatesResponse,
  PaginatedResponse,
} from '../types';

export class CarsModule {
  constructor(private readonly http: AxiosInstance) {}

  /**
   * List cars with pagination and filtering
   */
  async list(query?: CarQueryDto): Promise<PaginatedResponse<Car>> {
    const response = await this.http.get<PaginatedResponse<Car>>('/cars', {
      params: query,
    });
    return response.data;
  }

  /**
   * Get a single car by ID
   */
  async get(id: number): Promise<Car> {
    const response = await this.http.get<Car>(`/cars/${id}`);
    return response.data;
  }

  /**
   * Check car availability for specific dates
   */
  async checkAvailability(
    id: number,
    startDate: string,
    endDate: string
  ): Promise<CarAvailability> {
    const response = await this.http.get<CarAvailability>(`/cars/${id}/availability`, {
      params: { startDate, endDate },
    });
    return response.data;
  }

  /**
   * Get availability calendar for a car (admin only)
   */
  async getAvailabilityCalendar(
    id: number,
    year: number,
    month?: number
  ): Promise<CarAvailabilityCalendar> {
    const response = await this.http.get<CarAvailabilityCalendar>(
      `/cars/${id}/availability/calendar`,
      { params: { year, month } }
    );
    return response.data;
  }

  /**
   * Block dates for a car (admin only)
   */
  async blockDates(id: number, dates: string[]): Promise<BlockDatesResponse> {
    const response = await this.http.post<BlockDatesResponse>(
      `/cars/${id}/availability/block`,
      { dates }
    );
    return response.data;
  }

  /**
   * Unblock dates for a car (admin only)
   */
  async unblockDates(id: number, dates: string[]): Promise<UnblockDatesResponse> {
    const response = await this.http.post<UnblockDatesResponse>(
      `/cars/${id}/availability/unblock`,
      { dates }
    );
    return response.data;
  }

  /**
   * Create a new car (admin only)
   */
  async create(data: CreateCarDto): Promise<Car> {
    const response = await this.http.post<Car>('/cars', data);
    return response.data;
  }

  /**
   * Update a car (admin only)
   */
  async update(id: number, data: UpdateCarDto): Promise<Car> {
    const response = await this.http.put<Car>(`/cars/${id}`, data);
    return response.data;
  }

  /**
   * Delete a car (admin only)
   */
  async delete(id: number): Promise<void> {
    await this.http.delete(`/cars/${id}`);
  }
}
