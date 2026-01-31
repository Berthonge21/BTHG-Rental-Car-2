import type { AxiosInstance } from 'axios';
import type { UserProfile, UpdateProfileDto } from '../types';

export class UsersModule {
  constructor(private readonly http: AxiosInstance) {}

  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile> {
    const response = await this.http.get<UserProfile>('/users/me');
    return response.data;
  }

  /**
   * Update current user profile
   */
  async updateProfile(data: UpdateProfileDto): Promise<UserProfile> {
    const response = await this.http.patch<UserProfile>('/users/me', data);
    return response.data;
  }
}
