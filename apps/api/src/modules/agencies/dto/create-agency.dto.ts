import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, MaxLength, IsOptional, IsInt } from 'class-validator';

export class CreateAgencyDto {
  @ApiProperty({
    description: 'Agency name',
    example: 'Premium Car Rentals',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'Agency address',
    example: '123 Business Street, Suite 100',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  address: string;

  @ApiProperty({
    description: 'Agency email',
    example: 'contact@premiumrentals.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Agency phone number',
    example: '+1234567890',
    maxLength: 15,
  })
  @IsString()
  @MaxLength(15)
  telephone: string;

  @ApiProperty({
    description: 'ID of the responsible admin user',
    example: 1,
  })
  @IsInt()
  responsibleId: number;

  @ApiPropertyOptional({
    description: 'Agency logo URL',
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
  @IsString()
  image?: string;
}
