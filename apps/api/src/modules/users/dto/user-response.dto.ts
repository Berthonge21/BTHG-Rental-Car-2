import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserProfileResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstname: string;

  @ApiProperty({ example: 'Doe' })
  name: string;

  @ApiProperty({ example: '+1234567890' })
  telephone: string;

  @ApiProperty({ example: '123 Main Street' })
  address: string;

  @ApiProperty({ example: 'New York' })
  city: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  image?: string;

  @ApiProperty({ example: 'user' })
  role: string;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  createdAt: Date;
}
