import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateAdminStatusDto {
  @ApiProperty({
    description: 'New status for the admin user',
    enum: ['activate', 'deactivate'],
    example: 'deactivate',
  })
  @IsEnum(['activate', 'deactivate'], {
    message: 'Status must be either activate or deactivate',
  })
  status: 'activate' | 'deactivate';
}
