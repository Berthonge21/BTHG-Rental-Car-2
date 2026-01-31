import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CarAgencyDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Premium Car Rentals' })
  name: string;
}

export class CarResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  agencyId: number;

  @ApiProperty({ example: 'Toyota' })
  brand: string;

  @ApiProperty({ example: 'Camry' })
  model: string;

  @ApiProperty({ example: 2023 })
  year: number;

  @ApiProperty({ example: 15000 })
  mileage: number;

  @ApiProperty({ example: 75.0 })
  price: number;

  @ApiProperty({ example: 'ABC-1234' })
  registration: string;

  @ApiProperty({ example: 'Gasoline' })
  fuel: string;

  @ApiProperty({ example: 4 })
  door: number;

  @ApiProperty({ example: 'Automatic' })
  gearBox: string;

  @ApiPropertyOptional({ example: 'Comfortable sedan with great fuel efficiency' })
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/car.jpg' })
  image?: string;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: CarAgencyDto })
  Agency?: CarAgencyDto;
}

export class CarAvailabilityResponseDto {
  @ApiProperty({ example: 1 })
  carId: number;

  @ApiProperty({ example: true })
  available: boolean;

  @ApiProperty({
    example: { startDate: '2024-03-15', endDate: '2024-03-20' },
  })
  requestedDates: {
    startDate: string;
    endDate: string;
  };

  @ApiPropertyOptional({
    description: 'Conflicting rental if not available',
  })
  conflictingRental?: {
    id: number;
    startDate: Date;
    endDate: Date;
  };
}
