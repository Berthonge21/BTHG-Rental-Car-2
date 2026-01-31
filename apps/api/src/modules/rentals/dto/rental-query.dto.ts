import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { RentalStatus } from '@automobelite/database';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class RentalQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by rental status',
    enum: RentalStatus,
    example: 'reserved',
  })
  @IsOptional()
  @IsEnum(RentalStatus)
  status?: RentalStatus;

  @ApiPropertyOptional({
    description: 'Filter rentals starting after this date',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter rentals ending before this date',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
