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
import { InquiryStatus } from '../../common/enums/inquiry.enum';
import { User } from '../../users/entities/user.entity';
import { Property } from '../../properties/entities/property.entity';

export enum InquiryType {
  GENERAL = 'GENERAL',
  VIEWING = 'VIEWING',
  FINANCING = 'FINANCING',
  OFFER = 'OFFER',
}

@Entity('inquiries')
export class Inquiry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  clientId: number;

  @ManyToOne(() => User, (user) => user.clientInquiries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column({ type: 'int' })
  propertyId: number;

  @ManyToOne(() => Property, (property) => property.inquiries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column({
    type: 'enum',
    enum: InquiryType,
    default: InquiryType.GENERAL,
  })
  inquiryType: InquiryType;

  @Column({ type: 'int', nullable: true })
  assignedAgentId: number | null;

  @ManyToOne(() => User, (user) => user.agentInquiries, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assignedAgentId' })
  assignedAgent: User | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  subject: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  offerAmount: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contactNumber: string;

  @Index()
  @Column({
    type: 'enum',
    enum: InquiryStatus,
    default: InquiryStatus.PENDING,
  })
  status: InquiryStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  legacyStatus: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
