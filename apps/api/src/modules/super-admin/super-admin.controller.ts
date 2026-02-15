import {
  Controller,
  Get,
  Post,
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
  ApiQuery,
} from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service';
import {
  CreateAdminUserDto,
  AssignAgencyDto,
  GlobalStatsDto,
  UpdateAdminStatusDto,
} from './dto';
import { RentalQueryDto, RentalResponseDto } from '../rentals/dto';
import { AgencyResponseDto } from '../agencies/dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators';

@ApiTags('super-admin')
@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superAdmin')
@ApiBearerAuth('JWT-auth')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get global dashboard',
    description: 'Get global statistics across all agencies (super-admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Global dashboard statistics',
    type: GlobalStatsDto,
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Requires super-admin role' })
  async getDashboard() {
    return this.superAdminService.getGlobalDashboard();
  }

  @Get('agencies')
  @ApiOperation({
    summary: 'List all agencies',
    description: 'Get a paginated list of all agencies (super-admin only)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of agencies',
    type: [AgencyResponseDto],
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Requires super-admin role' })
  async getAgencies(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.superAdminService.getAllAgencies(
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('rentals')
  @ApiOperation({
    summary: 'List all rentals',
    description: 'Get a paginated list of all rentals across all agencies (super-admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all rentals',
    type: [RentalResponseDto],
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Requires super-admin role' })
  async getRentals(@Query() query: RentalQueryDto) {
    return this.superAdminService.getAllRentals(query);
  }

  @Get('users')
  @ApiOperation({
    summary: 'List all admin users',
    description: 'Get a paginated list of all admin users (super-admin only)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of admin users',
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Requires super-admin role' })
  async getAdminUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.superAdminService.getAdminUsers(
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Patch('users/:id/status')
  @ApiOperation({
    summary: 'Update admin user status',
    description: 'Activate or deactivate an admin user (super-admin only). Deactivating an admin also deactivates their agency.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Admin user ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin status updated successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Admin user not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot change status (active rentals or super admin)' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Requires super-admin role' })
  async updateAdminStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminStatusDto,
  ) {
    return this.superAdminService.updateAdminStatus(id, dto);
  }

  @Post('users')
  @ApiOperation({
    summary: 'Create admin user',
    description: 'Create a new admin user (super-admin only)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Admin user created successfully',
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email already registered' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Requires super-admin role' })
  async createAdminUser(@Body() dto: CreateAdminUserDto) {
    return this.superAdminService.createAdminUser(dto);
  }

  @Patch('users/:id/agency')
  @ApiOperation({
    summary: 'Assign admin to agency',
    description: 'Assign an admin user as the responsible for an agency (super-admin only)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Admin user ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin assigned to agency successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User or agency not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Admin already assigned to another agency' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Requires super-admin role' })
  async assignAdminToAgency(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignAgencyDto,
  ) {
    return this.superAdminService.assignAdminToAgency(id, dto);
  }
}
