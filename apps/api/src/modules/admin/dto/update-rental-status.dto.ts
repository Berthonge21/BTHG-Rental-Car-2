import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RentalStatus } from '@automobelite/database';

export class UpdateRentalStatusDto {
  @ApiProperty({
    description: 'New rental status',
    enum: RentalStatus,
    example: 'ongoing',
  })
  @IsEnum(RentalStatus)
  status: RentalStatus;
}
