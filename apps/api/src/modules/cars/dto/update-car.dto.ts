import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsNumber, MaxLength, IsOptional, Min } from 'class-validator';

export class UpdateCarDto {
  @ApiPropertyOptional({
    description: 'Car brand',
    example: 'Toyota',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional({
    description: 'Car model',
    example: 'Camry',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional({
    description: 'Manufacturing year',
    example: 2023,
  })
  @IsOptional()
  @IsInt()
  @Min(1900)
  year?: number;

  @ApiPropertyOptional({
    description: 'Current mileage in km',
    example: 15000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  mileage?: number;

  @ApiPropertyOptional({
    description: 'Daily rental price',
    example: 75.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: 'License plate number',
    example: 'ABC-1234',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  registration?: string;

  @ApiPropertyOptional({
    description: 'Fuel type',
    example: 'Gasoline',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  fuel?: string;

  @ApiPropertyOptional({
    description: 'Number of doors',
    example: 4,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  door?: number;

  @ApiPropertyOptional({
    description: 'Transmission type',
    example: 'Automatic',
    maxLength: 25,
  })
  @IsOptional()
  @IsString()
  @MaxLength(25)
  gearBox?: string;

  @ApiPropertyOptional({
    description: 'Parking ID where the car is located',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  parkingId?: number;

  @ApiPropertyOptional({
    description: 'Car description',
    example: 'Comfortable sedan with great fuel efficiency',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiPropertyOptional({
    description: 'Car image URL',
    example: 'https://example.com/car.jpg',
  })
  @IsOptional()
  @IsString()
  image?: string;
}
