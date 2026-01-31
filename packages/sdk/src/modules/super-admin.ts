import type { AxiosInstance } from 'axios';
import type {
  GlobalStats,
  AdminUser,
  AdminUserQueryDto,
  CreateAdminUserDto,
  AssignAgencyDto,
  Agency,
  AgencyQueryDto,
  Rental,
  RentalQueryDto,
  PaginatedResponse,
} from '../types';

export class SuperAdminModule {
  constructor(private readonly http: AxiosInstance) {}

  /**
   * Get global dashboard statistics
   */
  async getDashboard(): Promise<GlobalStats> {
    const response = await this.http.get<GlobalStats>('/super-admin/dashboard');
    return response.data;
  }

  /**
   * List all agencies with pagination
   */
  async getAgencies(query?: AgencyQueryDto): Promise<PaginatedResponse<Agency>> {
    const response = await this.http.get<PaginatedResponse<Agency>>('/super-admin/agencies', {
      params: query,
    });
    return response.data;
  }

  /**
   * List all rentals with pagination
   */
  async getRentals(query?: RentalQueryDto): Promise<PaginatedResponse<Rental>> {
    const response = await this.http.get<PaginatedResponse<Rental>>('/super-admin/rentals', {
      params: query,
    });
    return response.data;
  }

  /**
   * List all admin users with pagination
   */
  async getUsers(query?: AdminUserQueryDto): Promise<PaginatedResponse<AdminUser>> {
    const response = await this.http.get<PaginatedResponse<AdminUser>>('/super-admin/users', {
      params: query,
    });
    return response.data;
  }

  /**
   * Create a new admin user
   */
  async createUser(data: CreateAdminUserDto): Promise<AdminUser> {
    const response = await this.http.post<AdminUser>('/super-admin/users', data);
    return response.data;
  }

  /**
   * Assign admin user to an agency
   */
  async assignAgency(userId: number, data: AssignAgencyDto): Promise<AdminUser> {
    const response = await this.http.patch<AdminUser>(
      `/super-admin/users/${userId}/agency`,
      data
    );
    return response.data;
  }
}
