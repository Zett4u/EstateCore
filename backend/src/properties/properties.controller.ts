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
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
  @Roles(UserRole.ADMIN, UserRole.AGENT, UserRole.CLIENT)
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
  @Roles(UserRole.ADMIN, UserRole.AGENT, UserRole.CLIENT)
  async updatePut(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @CurrentUser() user: User,
  ) {
    return this.update(id, updatePropertyDto, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT, UserRole.CLIENT)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @CurrentUser() user: User,
  ) {
    return this.propertiesService.update(id, updatePropertyDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT, UserRole.CLIENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.propertiesService.remove(id, user);
  }

  // Lab 05 Endpoint 13: GET /api/v1/properties/:id/photos (Public)
  @Get(':id/photos')
  async getPhotos(@Param('id', ParseIntPipe) id: number) {
    return this.propertiesService.getPhotos(id);
  }

  // Lab 05 Endpoint 14: POST /api/v1/properties/:id/photos (Agent own listing or Admin/Owner)
  @Post(':id/photos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT, UserRole.CLIENT)
  @UseInterceptors(FileInterceptor('photo'))
  @HttpCode(HttpStatus.CREATED)
  async uploadPhoto(
    @Param('id', ParseIntPipe) id: number,
    @Body() photoDto: any,
    @CurrentUser() user: User,
    @UploadedFile() file?: any,
  ) {
    return this.propertiesService.addPhoto(id, photoDto, user, file);
  }

  // Lab 05 Endpoint 15: POST /api/v1/properties/:id/inquiries (Buyer or Renter)
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

  // Lab 05 Endpoint 16: GET /api/v1/properties/:id/inquiries (Agent own listing or Admin/Owner)
  @Get(':id/inquiries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT, UserRole.CLIENT)
  async getPropertyInquiries(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Query() query: any,
  ) {
    return this.propertiesService.getPropertyInquiries(id, user, query);
  }

  // Lab 05 Endpoint 17: PATCH /api/v1/properties/:id/inquiries/:inquiryId (Agent own listing)
  @Patch(':id/inquiries/:inquiryId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  async updatePropertyInquiryStatus(
    @Param('id', ParseIntPipe) id: number,
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Body('status') status: string,
    @CurrentUser() user: User,
  ) {
    return this.propertiesService.updatePropertyInquiryStatus(id, inquiryId, status, user);
  }
}
