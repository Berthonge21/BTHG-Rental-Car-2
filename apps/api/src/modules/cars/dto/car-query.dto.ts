import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CarQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by agency ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  agencyId?: number;

  @ApiPropertyOptional({
    description: 'Filter by brand (partial match)',
    example: 'Toyota',
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({
    description: 'Filter by model (partial match)',
    example: 'Camry',
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({
    description: 'Minimum price',
    example: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price',
    example: 200,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Filter by fuel type',
    example: 'Gasoline',
  })
  @IsOptional()
  @IsString()
  fuel?: string;

  @ApiPropertyOptional({
    description: 'Filter by transmission type',
    example: 'Automatic',
  })
  @IsOptional()
  @IsString()
  gearBox?: string;

  @ApiPropertyOptional({
    description: 'Minimum year',
    example: 2020,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minYear?: number;
}
