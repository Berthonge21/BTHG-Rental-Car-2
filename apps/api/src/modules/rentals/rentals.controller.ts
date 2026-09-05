import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RentalsService } from './rentals.service';
import {
  CreateRentalDto,
  UpdateRentalDto,
  RentalQueryDto,
  RentalResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, Roles } from '../../common/decorators';

// Client.role and AgencyUser.role are disjoint enums ('user' vs.
// 'admin'/'superAdmin'), so gating on role here also closes the id-space
// collision between AgencyUser.id and Client.id: an agency user's JWT can
// never carry role: 'user', so it can never reach these client-scoped
// routes and read/cancel a stranger's booking that happens to share a
// numeric id. Agency staff must use /admin/rentals instead.
@ApiTags('rentals')
@Controller('rentals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('user')
@ApiBearerAuth('JWT-auth')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get user rentals',
    description: 'Get a paginated list of rentals for the authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of user rentals',
    type: [RentalResponseDto],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated' })
  async findAll(
    @CurrentUser() user: { id: number },
    @Query() query: RentalQueryDto,
  ) {
    return this.rentalsService.findAllForUser(user.id, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get rental by ID',
    description: 'Get detailed information about a specific rental. Users can only view their own rentals.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Rental ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rental details',
    type: RentalResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Rental not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not your rental' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.rentalsService.findOne(id, user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create rental',
    description: `
Create a new car rental reservation.

**Business Rules:**
- Car must be available for the requested dates
- Start date must be in the future
- End date must be after start date
    `,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Rental created successfully',
    type: RentalResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid dates or car not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Car not available for selected dates' })
  async create(
    @CurrentUser() user: { id: number },
    @Body() dto: CreateRentalDto,
  ) {
    return this.rentalsService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update rental',
    description: 'Update rental details. Only reserved rentals can be modified by users.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Rental ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rental updated successfully',
    type: RentalResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot modify non-reserved rental' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Rental not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not your rental' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; email: string },
    @Body() dto: UpdateRentalDto,
  ) {
    return this.rentalsService.update(id, user.id, dto, user.email);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel rental',
    description: `
Cancel a rental reservation.

**Cancellation Rules:**
- Only reserved rentals can be cancelled
- Ongoing or completed rentals cannot be cancelled
    `,
  })
  @ApiParam({ name: 'id', type: Number, description: 'Rental ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rental cancelled successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot cancel this rental' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Rental not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not your rental' })
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; email: string },
  ) {
    return this.rentalsService.cancel(id, user.id, user.email);
  }
}
