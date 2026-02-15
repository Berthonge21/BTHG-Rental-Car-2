import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto, UserProfileResponseDto } from './dto';
import { MessageResponseDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Get the profile of the currently authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile',
    type: UserProfileResponseDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated' })
  async getProfile(@CurrentUser() user: { id: number; type: 'client' | 'agency' }) {
    return this.usersService.getProfile(user.id, user.type);
  }

  @Post('me/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate current user account',
    description: 'Deactivate the currently authenticated user account. Fails if the user has active rentals.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account deactivated successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot deactivate with active rentals' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated' })
  async deactivateAccount(
    @CurrentUser() user: { id: number; type: 'client' | 'agency' },
  ) {
    return this.usersService.deactivateAccount(user.id, user.type);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Update the profile of the currently authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  async updateProfile(
    @CurrentUser() user: { id: number; type: 'client' | 'agency' },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto, user.type);
  }
}
