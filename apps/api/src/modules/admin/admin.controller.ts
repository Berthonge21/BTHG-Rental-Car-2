import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { DashboardStatsDto, UpdateRentalStatusDto } from './dto';
import { RentalQueryDto, RentalResponseDto } from '../rentals/dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../../common/decorators';
import { requireTenantScope } from '../../common/utils/tenant-scope';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superAdmin')
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get agency dashboard',
    description: 'Get dashboard statistics for the admin\'s agency',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard statistics',
    type: DashboardStatsDto,
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not an agency admin' })
  async getDashboard(
    @CurrentUser() user: { agencyId?: number; role: string },
  ) {
    return this.adminService.getDashboard(requireTenantScope(user)!);
  }

  @Get('rentals')
  @ApiOperation({
    summary: 'Get agency rentals',
    description: 'Get all rentals for the admin\'s agency with pagination and filters',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of agency rentals',
    type: [RentalResponseDto],
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not an agency admin' })
  async getRentals(
    @CurrentUser() user: { agencyId?: number; role: string },
    @Query() query: RentalQueryDto,
  ) {
    return this.adminService.getRentals(requireTenantScope(user)!, query);
  }

  @Get('rentals/:id')
  @ApiOperation({
    summary: 'Get rental details',
    description: 'Get detailed information about a specific rental for the admin\'s agency',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Rental ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rental details',
    type: RentalResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Rental not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not authorized for this rental' })
  async getRental(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { agencyId?: number; role: string },
  ) {
    return this.adminService.getRental(id, requireTenantScope(user));
  }

  @Patch('rentals/:id')
  @ApiOperation({
    summary: 'Update rental status',
    description: 'Approve, reject, or update the status of a rental (agency admin only)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Rental ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rental status updated',
    type: RentalResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Rental not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not authorized for this rental' })
  async updateRentalStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRentalStatusDto,
    @CurrentUser() user: { agencyId?: number; role: string },
  ) {
    return this.adminService.updateRentalStatus(id, dto.status, requireTenantScope(user)!);
  }
}
