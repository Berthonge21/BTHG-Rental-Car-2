import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { RentalStatus } from '@automobelite/database';

export class UpdateRentalDto {
  @ApiPropertyOptional({
    description: 'Rental status',
    enum: RentalStatus,
    example: 'ongoing',
  })
  @IsOptional()
  @IsEnum(RentalStatus)
  status?: RentalStatus;
}
