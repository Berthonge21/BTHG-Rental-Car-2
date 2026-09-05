import { ApiProperty } from '@nestjs/swagger';

export class UploadImageResponseDto {
  @ApiProperty({
    description: 'Public URL of the uploaded image in Supabase Storage',
    example: 'https://xxxx.supabase.co/storage/v1/object/public/images/cars/uuid.jpg',
  })
  url: string;
}
