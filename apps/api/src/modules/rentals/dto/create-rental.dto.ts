import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsDateString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateRentalDto {
  @ApiProperty({
    description: 'ID of the car to rent',
    example: 1,
  })
  @IsInt()
  carId: number;

  @ApiProperty({
    description: 'Rental start date',
    example: '2024-03-15',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Rental end date',
    example: '2024-03-20',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Pickup time',
    example: '2024-03-15T10:00:00Z',
  })
  @IsDateString()
  startTime: string;

  @ApiProperty({
    description: 'Return time',
    example: '2024-03-20T10:00:00Z',
  })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({
    description: 'Total rental price (calculated automatically if not provided)',
    example: 375.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  total?: number;
}
