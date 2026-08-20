import type { AxiosInstance } from 'axios';
import type {
  LoginDto,
  AdminLoginDto,
  RegisterDto,
  RefreshTokenDto,
  AuthResponse,
  RegisterResponse,
  CurrentUser,
} from '../types';
import type { MessageResponse } from '../types/common';

export class AuthModule {
  constructor(private readonly http: AxiosInstance) {}

  /**
   * Login as a client
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await this.http.post<AuthResponse>('/auth/login', data);
    return response.data;
  }

  /**
   * Login as admin or super-admin
   */
  async loginAdmin(data: AdminLoginDto): Promise<AuthResponse> {
    const response = await this.http.post<AuthResponse>('/auth/admin/login', data);
    return response.data;
  }

  /**
   * Register a new client. Does not log the caller in — the account is
   * created but no tokens are issued; call login() separately afterward.
   */
  async register(data: RegisterDto): Promise<RegisterResponse> {
    const response = await this.http.post<RegisterResponse>('/auth/register', data);
    return response.data;
  }

  /**
   * Refresh access token using refresh token
   */
  async refresh(data: RefreshTokenDto): Promise<AuthResponse> {
    const response = await this.http.post<AuthResponse>('/auth/refresh', data);
    return response.data;
  }

  /**
   * Get current authenticated user
   */
  async me(): Promise<CurrentUser> {
    const response = await this.http.get<CurrentUser>('/auth/me');
    return response.data;
  }

  /**
   * Logout (client-side token clearing)
   */
  async logout(): Promise<MessageResponse> {
    const response = await this.http.post<MessageResponse>('/auth/logout');
    return response.data;
  }

  /**
   * Reactivate a deactivated account using login credentials
   */
  async reactivateAccount(data: LoginDto): Promise<AuthResponse> {
    const response = await this.http.post<AuthResponse>('/auth/reactivate', data);
    return response.data;
  }
}
