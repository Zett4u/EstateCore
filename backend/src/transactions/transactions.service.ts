import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PropertyTransaction,
  TransactionType,
  PaymentMethod,
  TransactionStatus,
} from './entities/property-transaction.entity';
import { User } from '../users/entities/user.entity';
import { Agent } from '../agents/entities/agent.entity';
import { UserRole } from '../common/enums/role.enum';

export interface PropertyTransactionResponse {
  transactionId: number;
  propertyId: number;
  buyerId: number;
  agentId: number;
  amount: number;
  transactionType: TransactionType;
  paymentMethod: string;
  transactionDate: string | Date;
  status: TransactionStatus;
  notes?: string | null;
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(PropertyTransaction)
    private readonly transactionRepository: Repository<PropertyTransaction>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
  ) {}

  private mapToResponse(tx: PropertyTransaction): PropertyTransactionResponse {
    return {
      transactionId: tx.id,
      propertyId: tx.propertyId,
      buyerId: tx.buyerId,
      agentId: tx.agentId,
      amount: Number(tx.amount),
      transactionType: tx.transactionType,
      paymentMethod: tx.paymentMethod,
      transactionDate: tx.transactionDate,
      status: tx.status,
      notes: tx.notes,
    };
  }

  async findAll(user: User, propertyId?: number): Promise<PropertyTransactionResponse[]> {
    const qb = this.transactionRepository
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.property', 'property')
      .leftJoinAndSelect('tx.buyer', 'buyer')
      .leftJoinAndSelect('tx.agent', 'agent');

    if (user.role === UserRole.CLIENT) {
      qb.andWhere('tx.buyerId = :buyerId', { buyerId: user.id });
    } else if (user.role === UserRole.AGENT) {
      const agentProfile = await this.agentRepository.findOne({
        where: { userId: user.id },
      });
      if (agentProfile) {
        qb.andWhere('tx.agentId = :agentId', { agentId: agentProfile.id });
      } else {
        qb.andWhere('1=0');
      }
    }

    if (propertyId) {
      qb.andWhere('tx.propertyId = :propertyId', { propertyId });
    }

    qb.orderBy('tx.createdAt', 'DESC');
    const transactions = await qb.getMany();
    return transactions.map((t) => this.mapToResponse(t));
  }

  async create(data: {
    propertyId: number;
    buyerId: number;
    agentId: number;
    amount: number;
    transactionType: TransactionType;
    paymentMethod?: PaymentMethod;
    transactionDate?: string;
    notes?: string;
  }): Promise<PropertyTransactionResponse> {
    const tx = this.transactionRepository.create({
      propertyId: data.propertyId,
      buyerId: data.buyerId,
      agentId: data.agentId,
      amount: data.amount,
      transactionType: data.transactionType,
      paymentMethod: data.paymentMethod || PaymentMethod.BANK_TRANSFER,
      transactionDate: data.transactionDate || new Date().toISOString().split('T')[0],
      notes: data.notes || null,
      status: TransactionStatus.PENDING,
    });
    const saved = await this.transactionRepository.save(tx);
    return this.mapToResponse(saved);
  }
}
