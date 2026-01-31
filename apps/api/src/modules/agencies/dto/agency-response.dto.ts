import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AgencyResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Premium Car Rentals' })
  name: string;

  @ApiProperty({ example: '123 Business Street, Suite 100' })
  address: string;

  @ApiProperty({ example: 'contact@premiumrentals.com' })
  email: string;

  @ApiProperty({ example: '+1234567890' })
  telephone: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  image?: string;

  @ApiProperty({ example: 'activate', enum: ['activate', 'deactivate'] })
  status: string;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  updatedAt: Date;
}

export class AgencyStatsDto {
  @ApiProperty({ example: 25 })
  totalCars: number;

  @ApiProperty({ example: 18 })
  availableCars: number;

  @ApiProperty({ example: 7 })
  rentedCars: number;

  @ApiProperty({ example: 150 })
  totalRentals: number;

  @ApiProperty({ example: 12 })
  pendingRentals: number;

  @ApiProperty({ example: 5 })
  activeRentals: number;

  @ApiProperty({ example: 45000 })
  totalRevenue: number;
}
