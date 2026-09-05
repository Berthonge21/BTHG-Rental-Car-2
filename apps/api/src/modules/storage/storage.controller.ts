import { BadRequestException, Controller, Param, ParseEnumPipe, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StorageService, StorageFolder } from './storage.service';
import { UploadImageResponseDto } from './dto';

// Mirrors apps/web/src/lib/imageUtils.ts's ACCEPTED_IMAGE_TYPES — the
// frontend already rejects anything else before it gets here, this is the
// server not trusting that client-side check alone.
const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Generous headroom above the client's own 2MB pre-compression cap
// (imageUtils.ts) — compression usually lands well under this.
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

enum UploadFolder {
  Cars = 'cars',
  Avatars = 'avatars',
}

@ApiTags('storage')
@ApiBearerAuth()
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload/:folder')
  @ApiOperation({
    summary: 'Upload an image to Supabase Storage',
    description:
      'Replaces embedding base64 images directly in JSON bodies (see AUDIT.md §6.2/§10.3). ' +
      'Returns the public URL to store on the relevant record (Car.image, Client.image, AgencyUser.image, ...) instead.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'folder', enum: UploadFolder })
  @ApiResponse({ status: 201, type: UploadImageResponseDto })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE_BYTES } }))
  async upload(
    @Param('folder', new ParseEnumPipe(UploadFolder)) folder: UploadFolder,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadImageResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided — send it as multipart/form-data under the "file" field');
    }

    if (!ACCEPTED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Unsupported image type — use JPEG, PNG, or WebP');
    }

    const url = await this.storageService.uploadImage(folder as unknown as StorageFolder, file);
    return { url };
  }
}
