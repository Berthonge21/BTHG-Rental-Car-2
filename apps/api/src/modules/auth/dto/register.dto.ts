import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  firstname: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password (min 6 characters)',
    example: 'securePassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+1234567890',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  telephone: string;

  @ApiProperty({
    description: 'Driver license number',
    example: 'DL123456789',
    maxLength: 15,
  })
  @IsString()
  @MaxLength(15)
  numPermis: string;

  @ApiProperty({
    description: 'Street address',
    example: '123 Main Street',
    maxLength: 150,
  })
  @IsString()
  @MaxLength(150)
  address: string;

  @ApiProperty({
    description: 'City',
    example: 'New York',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiPropertyOptional({
    description: 'Profile image URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  image?: string;
}
