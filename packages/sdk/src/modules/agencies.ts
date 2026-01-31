import type { AxiosInstance } from 'axios';
import type {
  Agency,
  AgencyQueryDto,
  CreateAgencyDto,
  UpdateAgencyDto,
  AgencyStats,
  Car,
  CarQueryDto,
  PaginatedResponse,
} from '../types';

export class AgenciesModule {
  constructor(private readonly http: AxiosInstance) {}

  /**
   * List all agencies with pagination
   */
  async list(query?: AgencyQueryDto): Promise<PaginatedResponse<Agency>> {
    const response = await this.http.get<PaginatedResponse<Agency>>('/agencies', {
      params: query,
    });
    return response.data;
  }

  /**
   * Get a single agency by ID
   */
  async get(id: number): Promise<Agency> {
    const response = await this.http.get<Agency>(`/agencies/${id}`);
    return response.data;
  }

  /**
   * Get agency cars with pagination
   */
  async getCars(id: number, query?: CarQueryDto): Promise<PaginatedResponse<Car>> {
    const response = await this.http.get<PaginatedResponse<Car>>(`/agencies/${id}/cars`, {
      params: query,
    });
    return response.data;
  }

  /**
   * Get agency statistics (admin/super-admin only)
   */
  async getStats(id: number): Promise<AgencyStats> {
    const response = await this.http.get<AgencyStats>(`/agencies/${id}/stats`);
    return response.data;
  }

  /**
   * Create a new agency (super-admin only)
   */
  async create(data: CreateAgencyDto): Promise<Agency> {
    const response = await this.http.post<Agency>('/agencies', data);
    return response.data;
  }

  /**
   * Update an agency (super-admin only)
   */
  async update(id: number, data: UpdateAgencyDto): Promise<Agency> {
    const response = await this.http.put<Agency>(`/agencies/${id}`, data);
    return response.data;
  }

  /**
   * Delete an agency (super-admin only)
   */
  async delete(id: number): Promise<void> {
    await this.http.delete(`/agencies/${id}`);
  }
}
