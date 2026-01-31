import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
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

  @ApiProperty({ example: 128 })
  completedRentals: number;

  @ApiProperty({ example: 45000 })
  totalRevenue: number;

  @ApiProperty({ example: 8500 })
  monthlyRevenue: number;
}
