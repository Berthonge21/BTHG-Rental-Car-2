// User Profile DTOs
export interface UpdateProfileDto {
  firstname?: string;
  name?: string;
  telephone?: string;
  address?: string;
  city?: string;
  image?: string;
}

export interface UserProfile {
  id: number;
  email: string;
  firstname: string;
  name: string;
  telephone: string;
  address: string;
  city: string;
  image?: string;
  role: string;
  createdAt: string;
}
