import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { ApiError, ApiErrorData, NetworkError } from './errors';
import { AuthModule } from './modules/auth';
import { CarsModule } from './modules/cars';
import { RentalsModule } from './modules/rentals';
import { AgenciesModule } from './modules/agencies';
import { UsersModule } from './modules/users';
import { AdminModule } from './modules/admin';
import { SuperAdminModule } from './modules/super-admin';
import { StorageModule } from './modules/storage';
import type { AuthResponse, RefreshTokenDto } from './types';

export interface TokenStorage {
  getAccessToken(): string | null | Promise<string | null>;
  getRefreshToken(): string | null | Promise<string | null>;
  setTokens(accessToken: string, refreshToken: string): void | Promise<void>;
  clearTokens(): void | Promise<void>;
}

export interface BthgClientConfig {
  baseUrl: string;
  tokenStorage?: TokenStorage;
  onTokenRefresh?: (tokens: AuthResponse) => void | Promise<void>;
  onUnauthorized?: () => void | Promise<void>;
  debug?: boolean;
}

// Default localStorage-based token storage for web
export class LocalStorageTokenStorage implements TokenStorage {
  private accessTokenKey = 'bthg_access_token';
  private refreshTokenKey = 'bthg_refresh_token';

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.refreshTokenKey);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.accessTokenKey, accessToken);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }
}

// Memory-based token storage for server-side or testing
export class MemoryTokenStorage implements TokenStorage {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }
}

export class BthgClient {
  private http: AxiosInstance;
  private tokenStorage: TokenStorage;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];
  private config: BthgClientConfig;

  // Modules
  public readonly auth: AuthModule;
  public readonly cars: CarsModule;
  public readonly rentals: RentalsModule;
  public readonly agencies: AgenciesModule;
  public readonly users: UsersModule;
  public readonly admin: AdminModule;
  public readonly superAdmin: SuperAdminModule;
  public readonly storage: StorageModule;

  constructor(config: BthgClientConfig) {
    this.config = config;
    this.tokenStorage = config.tokenStorage ?? new LocalStorageTokenStorage();

    this.http = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();

    // Initialize modules
    this.auth = new AuthModule(this.http);
    this.cars = new CarsModule(this.http);
    this.rentals = new RentalsModule(this.http);
    this.agencies = new AgenciesModule(this.http);
    this.users = new UsersModule(this.http);
    this.admin = new AdminModule(this.http);
    this.superAdmin = new SuperAdminModule(this.http);
    this.storage = new StorageModule(this.http);
  }

  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.http.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await this.tokenStorage.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        if (this.config.debug) {
          console.log(`[SDK] ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors and token refresh
    this.http.interceptors.response.use(
      (response: AxiosResponse) => {
        if (this.config.debug) {
          console.log(`[SDK] Response ${response.status}`, response.data);
        }
        return response;
      },
      async (error: AxiosError<ApiErrorData>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // Network error
        if (!error.response) {
          throw new NetworkError(error.message);
        }

        // Handle 401 - try to refresh token
        if (
          error.response.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('/auth/')
        ) {
          if (this.isRefreshing) {
            // Wait for the refresh to complete
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(this.http(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await this.tokenStorage.getRefreshToken();
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const response = await this.http.post<AuthResponse>('/auth/refresh', {
              refreshToken,
            } as RefreshTokenDto);

            const { accessToken, refreshToken: newRefreshToken } = response.data;
            await this.tokenStorage.setTokens(accessToken, newRefreshToken);

            if (this.config.onTokenRefresh) {
              await this.config.onTokenRefresh(response.data);
            }

            // Retry all queued requests
            this.refreshSubscribers.forEach((callback) => callback(accessToken));
            this.refreshSubscribers = [];

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }

            return this.http(originalRequest);
          } catch (refreshError) {
            await this.tokenStorage.clearTokens();
            if (this.config.onUnauthorized) {
              await this.config.onUnauthorized();
            }
            throw ApiError.fromAxiosError(error);
          } finally {
            this.isRefreshing = false;
          }
        }

        throw ApiError.fromAxiosError(error);
      }
    );
  }

  /**
   * Set authentication tokens manually
   */
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await this.tokenStorage.setTokens(accessToken, refreshToken);
  }

  /**
   * Clear authentication tokens
   */
  async clearTokens(): Promise<void> {
    await this.tokenStorage.clearTokens();
  }

  /**
   * Check if user is authenticated (has access token)
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.tokenStorage.getAccessToken();
    return !!token;
  }

  /**
   * Get the underlying Axios instance for custom requests
   */
  getHttpClient(): AxiosInstance {
    return this.http;
  }
}

// Factory function for creating client
export function createBthgClient(config: BthgClientConfig): BthgClient {
  return new BthgClient(config);
}
