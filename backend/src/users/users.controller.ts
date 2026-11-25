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
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/role.enum';
import { User } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Lab 05 Endpoint 1: POST /api/v1/users (Public)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // Lab 05 Endpoint 2: GET /api/v1/users/:id (Authenticated own profile or Admin)
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('You can only view your own profile.');
    }
    return this.usersService.findOne(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: string,
  ): Promise<User[]> {
    const activeBool = isActive !== undefined ? isActive === 'true' : undefined;
    return this.usersService.findAll(role, activeBool);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updatePut(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    return this.update(id, updateUserDto, currentUser);
  }

  // Lab 05 Endpoint 3: PATCH /api/v1/users/:id (Authenticated own profile)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    if (currentUser.role !== UserRole.ADMIN) {
      if (currentUser.id !== id) {
        throw new ForbiddenException('You can only update your own profile.');
      }
      // Non-admins cannot elevate their own role or toggle their active status
      delete updateUserDto.role;
      delete updateUserDto.isActive;
    }
    return this.usersService.update(id, updateUserDto);
  }

  // Lab 05 Endpoint 4: DELETE /api/v1/users/:id (Admin only)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.remove(id);
  }
}
