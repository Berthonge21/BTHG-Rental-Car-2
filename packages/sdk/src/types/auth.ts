// Login DTOs
export interface LoginDto {
  email: string;
  password: string;
}

export interface AdminLoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

// Register DTO
export interface RegisterDto {
  firstname: string;
  name: string;
  email: string;
  password: string;
  telephone: string;
  numPermis: string;
  address: string;
  city: string;
  image?: string;
}

// Response DTOs
export interface UserResponse {
  id: number;
  email: string;
  firstname: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

// POST /auth/register does not log the caller in — it only creates the
// account. No tokens are issued; call login() separately afterward.
export interface RegisterResponse {
  message: string;
  user: {
    id: number;
    email: string;
    name: string;
    firstname: string;
  };
}

export interface CurrentUserAgency {
  id: number;
  name: string;
}

export interface CurrentUser {
  id: number;
  email: string;
  firstname: string;
  name: string;
  role: string;
  status?: string;
  deactivatedAt?: string | null;
  telephone?: string;
  address?: string;
  city?: string;
  image?: string;
  agency?: CurrentUserAgency | null;
  createdAt?: string;
}
