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
import { CarsService } from './cars.service';
import {
  CreateCarDto,
  UpdateCarDto,
  CarQueryDto,
  CarResponseDto,
  CarAvailabilityResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser, Public } from '../../common/decorators';
import { requireTenantScope } from '../../common/utils/tenant-scope';

@ApiTags('cars')
@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'List cars',
    description: 'Get a paginated list of cars with optional filters',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of cars',
    type: [CarResponseDto],
  })
  async findAll(@Query() query: CarQueryDto) {
    return this.carsService.findAll(query, true);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get car by ID',
    description: 'Get detailed information about a specific car',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Car ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Car details',
    type: CarResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Car not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.carsService.findOne(id, true);
  }

  @Get(':id/availability')
  @Public()
  @ApiOperation({
    summary: 'Check car availability',
    description: 'Check if a car is available for the specified date range',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Car ID' })
  @ApiQuery({ name: 'startDate', type: String, description: 'Start date (YYYY-MM-DD)', example: '2024-03-15' })
  @ApiQuery({ name: 'endDate', type: String, description: 'End date (YYYY-MM-DD)', example: '2024-03-20' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Availability status',
    type: CarAvailabilityResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Car not found' })
  async checkAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.carsService.checkAvailability(id, startDate, endDate);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superAdmin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create car (Admin)',
    description: 'Create a new car. Agency admins can only create cars for their own agency.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Car created successfully',
    type: CarResponseDto,
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Cannot create car for another agency' })
  async create(
    @Body() dto: CreateCarDto,
    @CurrentUser() user: { agencyId?: number; role: string },
  ) {
    return this.carsService.create(dto, requireTenantScope(user));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superAdmin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update car (Admin)',
    description: 'Update a car. Agency admins can only update cars from their own agency.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Car ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Car updated successfully',
    type: CarResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Car not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Cannot update car from another agency' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCarDto,
    @CurrentUser() user: { agencyId?: number; role: string },
  ) {
    return this.carsService.update(id, dto, requireTenantScope(user));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superAdmin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete car (Admin)',
    description: 'Delete a car. Agency admins can only delete cars from their own agency.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Car ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Car deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Car not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Cannot delete car from another agency' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { agencyId?: number; role: string },
  ) {
    return this.carsService.remove(id, requireTenantScope(user));
  }

  @Get(':id/availability/calendar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superAdmin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get availability calendar (Admin)',
    description: 'Get blocked dates and rental dates for a car',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Car ID' })
  @ApiQuery({ name: 'year', type: Number, description: 'Year', example: 2024 })
  @ApiQuery({ name: 'month', type: Number, required: false, description: 'Month (1-12)', example: 3 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Availability calendar' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Car not found' })
  async getAvailabilityCalendar(
    @Param('id', ParseIntPipe) id: number,
    @Query('year') year: string,
    @Query('month') month?: string,
  ) {
    return this.carsService.getAvailabilityCalendar(
      id,
      parseInt(year, 10),
      month ? parseInt(month, 10) : undefined,
    );
  }

  @Post(':id/availability/block')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superAdmin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Block dates (Admin)',
    description: 'Block specific dates for a car. Blocked dates cannot be booked.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Car ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Dates blocked successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Car not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Cannot manage availability for another agency' })
  async blockDates(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { dates: string[] },
    @CurrentUser() user: { agencyId?: number; role: string },
  ) {
    return this.carsService.blockDates(id, body.dates, requireTenantScope(user));
  }

  @Post(':id/availability/unblock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superAdmin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Unblock dates (Admin)',
    description: 'Unblock specific dates for a car.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Car ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Dates unblocked successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Car not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Cannot manage availability for another agency' })
  async unblockDates(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { dates: string[] },
    @CurrentUser() user: { agencyId?: number; role: string },
  ) {
    return this.carsService.unblockDates(id, body.dates, requireTenantScope(user));
  }
}
