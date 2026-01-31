import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, MaxLength, IsOptional, IsEnum } from 'class-validator';
import { Status } from '@automobelite/database';

export class UpdateAgencyDto {
  @ApiPropertyOptional({
    description: 'Agency name',
    example: 'Premium Car Rentals',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({
    description: 'Agency address',
    example: '123 Business Street, Suite 100',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({
    description: 'Agency email',
    example: 'contact@premiumrentals.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Agency phone number',
    example: '+1234567890',
    maxLength: 15,
  })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  telephone?: string;

  @ApiPropertyOptional({
    description: 'Agency logo URL',
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({
    description: 'Agency status',
    enum: Status,
    example: 'activate',
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
