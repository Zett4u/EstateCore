import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Property } from '../../properties/entities/property.entity';
import { PropertyTransaction } from '../../transactions/entities/property-transaction.entity';

export enum AgentVerificationStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'int', unique: true })
  userId: number;

  @OneToOne(() => User, (user) => user.agentProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 50, nullable: true })
  licenseNumber: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  agencyName: string | null;

  @Column({
    type: 'enum',
    enum: AgentVerificationStatus,
    default: AgentVerificationStatus.PENDING_VERIFICATION,
  })
  verificationStatus: AgentVerificationStatus;

  @Column({ type: 'varchar', length: 150, nullable: true })
  specialization: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relationships
  @OneToMany(() => Property, (property) => property.assignedAgent)
  properties: Property[];

  @OneToMany(() => PropertyTransaction, (tx) => tx.agent)
  transactions: PropertyTransaction[];
}
