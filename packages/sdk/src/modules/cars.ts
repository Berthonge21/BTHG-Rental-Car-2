import type { AxiosInstance } from 'axios';
import type {
  Car,
  CarQueryDto,
  CreateCarDto,
  UpdateCarDto,
  CarAvailability,
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
