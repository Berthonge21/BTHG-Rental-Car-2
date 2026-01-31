import type { AxiosInstance } from 'axios';
import type {
  Rental,
  RentalQueryDto,
  CreateRentalDto,
  UpdateRentalDto,
  PaginatedResponse,
} from '../types';

export class RentalsModule {
  constructor(private readonly http: AxiosInstance) {}

  /**
   * List user's rentals with pagination and filtering
   */
  async list(query?: RentalQueryDto): Promise<PaginatedResponse<Rental>> {
    const response = await this.http.get<PaginatedResponse<Rental>>('/rentals', {
      params: query,
    });
    return response.data;
  }

  /**
   * Get a single rental by ID (own rentals only)
   */
  async get(id: number): Promise<Rental> {
    const response = await this.http.get<Rental>(`/rentals/${id}`);
    return response.data;
  }

  /**
   * Create a new rental reservation
   */
  async create(data: CreateRentalDto): Promise<Rental> {
    const response = await this.http.post<Rental>('/rentals', data);
    return response.data;
  }

  /**
   * Update a rental (reserved status only)
   */
  async update(id: number, data: UpdateRentalDto): Promise<Rental> {
    const response = await this.http.patch<Rental>(`/rentals/${id}`, data);
    return response.data;
  }

  /**
   * Cancel a rental (reserved status only)
   */
  async cancel(id: number): Promise<void> {
    await this.http.delete(`/rentals/${id}`);
  }
}
