import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, MaxLength, IsOptional, IsEnum, IsInt } from 'class-validator';
import { UserRole } from '@rentalcar/database';

export class CreateAdminUserDto {
  @ApiProperty({
    description: 'Admin first name',
    example: 'Admin',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  firstname: string;

  @ApiProperty({
    description: 'Admin last name',
    example: 'User',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@agency.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Admin password (min 6 characters)',
    example: 'securePassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: 'Admin role',
    enum: UserRole,
    default: 'admin',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Profile image URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  // A Supabase Storage URL, not an embedded base64 payload — see
  // apps/web/src/lib/imageUtils.ts / StorageModule.
  @MaxLength(500)
  image?: string;

  @ApiPropertyOptional({
    description:
      'Agency this admin belongs to. Required unless role is superAdmin — an admin created without one cannot access any agency-scoped resource.',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  agencyId?: number;
}
