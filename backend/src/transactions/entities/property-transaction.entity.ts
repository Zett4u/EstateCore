import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Property } from '../../properties/entities/property.entity';
import { User } from '../../users/entities/user.entity';
import { Agent } from '../../agents/entities/agent.entity';

export enum TransactionType {
  SALE = 'SALE',
  RENT = 'RENT',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  FINANCING = 'FINANCING',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('property_transactions')
export class PropertyTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  propertyId: number;

  @ManyToOne(() => Property, (property) => property.transactions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Index()
  @Column({ type: 'int' })
  buyerId: number;

  @ManyToOne(() => User, (user) => user.buyerTransactions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'buyerId' })
  buyer: User;

  @Index()
  @Column({ type: 'int' })
  agentId: number;

  @ManyToOne(() => Agent, (agent) => agent.transactions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'agentId' })
  agent: Agent;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  transactionType: TransactionType;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.BANK_TRANSFER,
  })
  paymentMethod: PaymentMethod;

  @Index()
  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Index()
  @Column({ type: 'date' })
  transactionDate: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
