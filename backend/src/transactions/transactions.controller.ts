import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { TransactionsService, PropertyTransactionResponse } from './transactions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

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
