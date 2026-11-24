import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { InquiriesService } from '../inquiries/inquiries.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertyDto } from './dto/query-property.dto';
import { CreateInquiryDto } from '../inquiries/dto/create-inquiry.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/role.enum';
import { User } from '../users/entities/user.entity';

@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly inquiriesService: InquiriesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createPropertyDto: CreatePropertyDto,
    @CurrentUser() user: User,
  ) {
    return this.propertiesService.create(createPropertyDto, user);
  }

  @Get()
  async findAll(@Query() query: QueryPropertyDto) {
    return this.propertiesService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.propertiesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  async updatePut(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @CurrentUser() user: User,
  ) {
    return this.update(id, updatePropertyDto, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @CurrentUser() user: User,
  ) {
    return this.propertiesService.update(id, updatePropertyDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.propertiesService.remove(id, user);
  }

  // Nested Endpoint 1: POST /api/v1/properties/:id/photos (PDF Lab 05 EP-17)
  @Post(':id/photos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @HttpCode(HttpStatus.CREATED)
  async uploadPhoto(
    @Param('id', ParseIntPipe) id: number,
    @Body() photoDto: any,
    @CurrentUser() user: User,
  ) {
    return this.propertiesService.addPhoto(id, photoDto, user);
  }

  // Nested Endpoint 2: POST /api/v1/properties/:id/inquiries (PDF Lab 05 EP-18)
  @Post(':id/inquiries')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createInquiry(
    @Param('id', ParseIntPipe) id: number,
    @Body() createInquiryDto: CreateInquiryDto,
    @CurrentUser() user: User,
  ) {
    createInquiryDto.propertyId = id;
    return this.inquiriesService.create(createInquiryDto, user);
  }
}
