import type { AxiosInstance } from 'axios';
import type {
  DashboardStats,
  UpdateRentalStatusDto,
  Rental,
  RentalQueryDto,
  PaginatedResponse,
} from '../types';

export class AdminModule {
  constructor(private readonly http: AxiosInstance) {}

  /**
   * Get agency dashboard statistics
   */
  async getDashboard(): Promise<DashboardStats> {
    const response = await this.http.get<DashboardStats>('/admin/dashboard');
    return response.data;
  }

  /**
   * Get agency rentals with pagination and filtering
   */
  async getRentals(query?: RentalQueryDto): Promise<PaginatedResponse<Rental>> {
    const response = await this.http.get<PaginatedResponse<Rental>>('/admin/rentals', {
      params: query,
    });
    return response.data;
  }

  /**
   * Update rental status (approve, complete, cancel)
   */
  async updateRentalStatus(id: number, data: UpdateRentalStatusDto): Promise<Rental> {
    const response = await this.http.patch<Rental>(`/admin/rentals/${id}`, data);
    return response.data;
  }
}
