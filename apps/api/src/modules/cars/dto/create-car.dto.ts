import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsNumber, MaxLength, IsOptional, Min } from 'class-validator';

export class CreateCarDto {
  @ApiProperty({
    description: 'Agency ID the car belongs to',
    example: 1,
  })
  @IsInt()
  agencyId: number;

  @ApiProperty({
    description: 'Car brand',
    example: 'Toyota',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  brand: string;

  @ApiProperty({
    description: 'Car model',
    example: 'Camry',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  model: string;

  @ApiProperty({
    description: 'Manufacturing year',
    example: 2023,
  })
  @IsInt()
  @Min(1900)
  year: number;

  @ApiProperty({
    description: 'Current mileage in km',
    example: 15000,
  })
  @IsInt()
  @Min(0)
  mileage: number;

  @ApiProperty({
    description: 'Daily rental price',
    example: 75.0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'License plate number',
    example: 'ABC-1234',
    maxLength: 20,
  })
  @IsString()
  @MaxLength(20)
  registration: string;

  @ApiProperty({
    description: 'Fuel type',
    example: 'Gasoline',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  fuel: string;

  @ApiProperty({
    description: 'Number of doors',
    example: 4,
  })
  @IsInt()
  @Min(1)
  door: number;

  @ApiProperty({
    description: 'Transmission type',
    example: 'Automatic',
    maxLength: 25,
  })
  @IsString()
  @MaxLength(25)
  gearBox: string;

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
