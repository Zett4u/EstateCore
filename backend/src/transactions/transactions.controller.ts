import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TransactionsService, PropertyTransactionResponse } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/role.enum';
import { User } from '../users/entities/user.entity';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createTransactionDto: CreateTransactionDto,
    @CurrentUser() user: User,
  ): Promise<PropertyTransactionResponse> {
    return this.transactionsService.recordTransaction(createTransactionDto, user);
  }

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query('propertyId') propertyId?: string,
  ): Promise<PropertyTransactionResponse[]> {
    const propId = propertyId ? parseInt(propertyId, 10) : undefined;
    return this.transactionsService.findAll(user, propId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<PropertyTransactionResponse> {
    return this.transactionsService.findOne(id, user);
  }
}
