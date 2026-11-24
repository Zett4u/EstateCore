import { Injectable } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/role.enum';

export interface PropertyTransactionResponse {
  transactionId: number;
  propertyId: number;
  buyerId: number;
  agentId: number;
  amount: number;
  transactionType: 'SALE' | 'RENT';
  paymentMethod: string;
  transactionDate: Date;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
}

@Injectable()
export class TransactionsService {
  // In-memory registry for Phase 1 prior to Phase 2 physical DB migration
  private transactions: PropertyTransactionResponse[] = [];

  async findAll(user: User, propertyId?: number): Promise<PropertyTransactionResponse[]> {
    let result = this.transactions;

    if (user.role === UserRole.CLIENT) {
      result = result.filter((t) => t.buyerId === user.id);
    } else if (user.role === UserRole.AGENT) {
      result = result.filter((t) => t.agentId === user.id);
    }

    if (propertyId) {
      result = result.filter((t) => t.propertyId === propertyId);
    }

    return result;
  }
}
