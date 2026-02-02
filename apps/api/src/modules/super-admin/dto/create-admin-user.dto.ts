import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, MaxLength, IsOptional, IsEnum } from 'class-validator';
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
  image?: string;
}
