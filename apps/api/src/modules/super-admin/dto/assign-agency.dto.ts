import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class AssignAgencyDto {
  @ApiProperty({
    description: 'Agency ID to assign the admin to',
    example: 1,
  })
  @IsInt()
  agencyId: number;
}
