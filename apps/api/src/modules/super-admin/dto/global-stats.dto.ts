import { ApiProperty } from '@nestjs/swagger';

export class GlobalStatsDto {
  @ApiProperty({ example: 5 })
  totalAgencies: number;

  @ApiProperty({ example: 4 })
  activeAgencies: number;

  @ApiProperty({ example: 125 })
  totalCars: number;

  @ApiProperty({ example: 15 })
  totalAdmins: number;

  @ApiProperty({ example: 500 })
  totalClients: number;

  @ApiProperty({ example: 1250 })
  totalRentals: number;

  @ApiProperty({ example: 45 })
  pendingRentals: number;

  @ApiProperty({ example: 32 })
  activeRentals: number;

  @ApiProperty({ example: 250000 })
  totalRevenue: number;

  @ApiProperty({ example: 45000 })
  monthlyRevenue: number;
}
