import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
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
import { AgenciesService } from './agencies.service';
import { CreateAgencyDto, UpdateAgencyDto, AgencyResponseDto, AgencyStatsDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Public } from '../../common/decorators';

@ApiTags('agencies')
@Controller('agencies')
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'List all agencies',
    description: 'Get a paginated list of all agencies (public)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of agencies',
    type: [AgencyResponseDto],
  })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.agenciesService.findAll(
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get agency by ID',
    description: 'Get detailed information about a specific agency',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Agency ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Agency details',
    type: AgencyResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Agency not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.agenciesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superAdmin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create agency (Super-Admin)',
    description: 'Create a new agency. Requires super-admin role.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Agency created successfully',
    type: AgencyResponseDto,
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Agency name or email already exists' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Requires super-admin role' })
  async create(@Body() dto: CreateAgencyDto) {
    return this.agenciesService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superAdmin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update agency (Super-Admin)',
    description: 'Update an existing agency. Requires super-admin role.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Agency ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Agency updated successfully',
    type: AgencyResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Agency not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Requires super-admin role' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAgencyDto,
  ) {
    return this.agenciesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superAdmin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete agency (Super-Admin)',
    description: 'Delete an agency. Requires super-admin role.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Agency ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Agency deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Agency not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Requires super-admin role' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.agenciesService.remove(id);
  }

  @Get(':id/cars')
  @Public()
  @ApiOperation({
    summary: 'Get agency cars',
    description: 'Get a paginated list of cars belonging to an agency',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Agency ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of agency cars' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Agency not found' })
  async getCars(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.agenciesService.getCars(
      id,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superAdmin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get agency stats (Admin)',
    description: 'Get statistics for an agency. Requires admin or super-admin role.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Agency ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Agency statistics',
    type: AgencyStatsDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Agency not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Requires admin role' })
  async getStats(@Param('id', ParseIntPipe) id: number) {
    return this.agenciesService.getStats(id);
  }
}
