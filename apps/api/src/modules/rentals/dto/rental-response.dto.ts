import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RentalCarDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Toyota' })
  brand: string;

  @ApiProperty({ example: 'Camry' })
  model: string;

  @ApiProperty({ example: 2023 })
  year: number;

  @ApiPropertyOptional({ example: 'https://example.com/car.jpg' })
  image?: string;

  @ApiProperty({ example: 75.0 })
  price: number;
}

export class RentalClientDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John' })
  firstname: string;

  @ApiProperty({ example: 'Doe' })
  name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: '+1234567890' })
  telephone: string;
}

export class RentalResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  clientId: number;

  @ApiProperty({ example: 1 })
  carId: number;

  @ApiProperty({ example: '2024-03-15T00:00:00Z' })
  startDate: Date;

  @ApiProperty({ example: '2024-03-20T00:00:00Z' })
  endDate: Date;

  @ApiProperty({ example: '2024-03-15T10:00:00Z' })
  startTime: Date;

  @ApiProperty({ example: '2024-03-20T10:00:00Z' })
  endTime: Date;

  @ApiProperty({ example: 375.0 })
  total: number;

  @ApiProperty({
    example: 'reserved',
    enum: ['reserved', 'ongoing', 'completed', 'cancelled'],
  })
  status: string;

  @ApiPropertyOptional({ type: RentalCarDto })
  car?: RentalCarDto;

  @ApiPropertyOptional({ type: RentalClientDto })
  client?: RentalClientDto;
}
