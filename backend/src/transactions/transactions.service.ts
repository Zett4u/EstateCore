import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  PropertyTransaction,
  TransactionType,
  PaymentMethod,
  TransactionStatus,
} from './entities/property-transaction.entity';
import { Property } from '../properties/entities/property.entity';
import { User } from '../users/entities/user.entity';
import { Agent } from '../agents/entities/agent.entity';
import { UserRole } from '../common/enums/role.enum';
import { PropertyStatus } from '../common/enums/property.enum';
import { CreateTransactionDto } from './dto/create-transaction.dto';

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
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
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

  async findOne(id: number, user: User): Promise<PropertyTransactionResponse> {
    const tx = await this.transactionRepository.findOne({
      where: { id },
      relations: ['property', 'buyer', 'agent'],
    });

    if (!tx) {
      throw new NotFoundException(`Transaction with ID ${id} not found.`);
    }

    if (user.role === UserRole.CLIENT && tx.buyerId !== user.id) {
      throw new ForbiddenException('You are not authorized to view this transaction.');
    } else if (user.role === UserRole.AGENT) {
      const agentProfile = await this.agentRepository.findOne({
        where: { userId: user.id },
      });
      if (!agentProfile || tx.agentId !== agentProfile.id) {
        throw new ForbiddenException('You are not authorized to view this transaction.');
      }
    }

    return this.mapToResponse(tx);
  }

  async recordTransaction(
    dto: CreateTransactionDto,
    user: User,
  ): Promise<PropertyTransactionResponse> {
    // 1. Authorization: Only AGENT or ADMIN can record a transaction
    let resolvedAgentId: number | null = null;

    if (user.role === UserRole.AGENT) {
      const agentProfile = await this.agentRepository.findOne({
        where: { userId: user.id },
      });
      if (!agentProfile) {
        throw new ForbiddenException('Agent profile not found for this user.');
      }
      resolvedAgentId = agentProfile.id;
    } else if (user.role === UserRole.ADMIN) {
      resolvedAgentId = null; // Resolved dynamically from property or default
    } else {
      throw new ForbiddenException('Only agents and administrators can record transactions.');
    }

    // 2. Validate financial and method inputs
    const amountNum = Number(dto.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new BadRequestException('Amount must be greater than 0.');
    }

    const txTypeStr = String(dto.transactionType || '').toUpperCase();
    if (!['SALE', 'RENT', 'LEASE'].includes(txTypeStr)) {
      throw new BadRequestException(`Invalid transaction type: ${dto.transactionType}. Allowed: Sale, Rent, Lease.`);
    }
    const transactionType = txTypeStr === 'RENT' ? TransactionType.RENT : TransactionType.SALE;

    let paymentMethod: PaymentMethod = PaymentMethod.BANK_TRANSFER;
    const pmUpper = String(dto.paymentMethod || '').toUpperCase().replace(/[\s_-]/g, '');
    if (pmUpper.includes('CASH')) paymentMethod = PaymentMethod.CASH;
    else if (pmUpper.includes('BANK')) paymentMethod = PaymentMethod.BANK_TRANSFER;
    else if (pmUpper.includes('GCASH')) paymentMethod = PaymentMethod.GCASH;
    else if (pmUpper.includes('CARD') || pmUpper.includes('CREDIT') || pmUpper.includes('DEBIT')) paymentMethod = PaymentMethod.CARD;
    else if (pmUpper.includes('CHECK') || pmUpper.includes('CHEQUE')) paymentMethod = PaymentMethod.CHECK;
    else if (pmUpper.includes('FINANC')) paymentMethod = PaymentMethod.FINANCING;
    else {
      throw new BadRequestException(`Invalid payment method: ${dto.paymentMethod}. Allowed: Cash, BankTransfer, GCash, Card, Check, Financing.`);
    }

    // 3. Buyer validation
    const buyer = await this.userRepository.findOne({
      where: { id: dto.buyerId },
    });
    if (!buyer) {
      throw new NotFoundException(`Buyer user with ID ${dto.buyerId} not found.`);
    }

    // 4. ATOMIC DATABASE TRANSACTION WITH PESSIMISTIC LOCKING
    // Ensures concurrent requests cannot create duplicate or conflicting completed sales/rentals
    return await this.dataSource.transaction(async (manager) => {
      const property = await manager
        .getRepository(Property)
        .createQueryBuilder('property')
        .setLock('pessimistic_write')
        .where('property.id = :id', { id: dto.propertyId })
        .getOne();

      if (!property) {
        throw new NotFoundException(`Property with ID ${dto.propertyId} not found.`);
      }

      const agentIdForDeal = resolvedAgentId !== null ? resolvedAgentId : (property.agentId || 1);

      // Agent can only record deal for own assigned listing (unless ADMIN)
      if (user.role === UserRole.AGENT && property.agentId !== agentIdForDeal) {
        throw new ForbiddenException('Only the listing agent can record transactions for this property.');
      }

      // Check property availability (Lab 05 EP 18: 409 Conflict if already sold or rented)
      const upperStatus = String(property.status).toUpperCase();
      if (upperStatus === 'SOLD' || property.status === PropertyStatus.SOLD) {
        throw new ConflictException(`Property is not available. Property ${property.id} already has status Sold.`);
      }
      if (upperStatus === 'RENTED' || property.status === PropertyStatus.RENTED) {
        throw new ConflictException(`Property is not available. Property ${property.id} already has status Rented.`);
      }

      // Create & Save Transaction
      const tx = manager.getRepository(PropertyTransaction).create({
        propertyId: property.id,
        buyerId: buyer.id,
        agentId: agentIdForDeal,
        amount: amountNum,
        transactionType,
        paymentMethod,
        transactionDate: dto.transactionDate || new Date().toISOString().split('T')[0],
        status: TransactionStatus.PENDING,
        notes: dto.notes || null,
      });

      const savedTx = await manager.getRepository(PropertyTransaction).save(tx);

      // Transition property status atomically
      if (transactionType === TransactionType.SALE) {
        property.status = PropertyStatus.SOLD;
      } else {
        property.status = PropertyStatus.RENTED;
      }
      await manager.getRepository(Property).save(property);

      return this.mapToResponse(savedTx);
    });
  }

  // Backward compatibility alias for tests
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
