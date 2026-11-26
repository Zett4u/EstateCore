import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';
import { UserRole } from '../../common/enums/role.enum';
import { Property } from '../../properties/entities/property.entity';
import { Inquiry } from '../../inquiries/entities/inquiry.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Agent } from '../../agents/entities/agent.entity';
import { PropertyTransaction } from '../../transactions/entities/property-transaction.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  fullName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contactNumber: string | null;

  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Academic PDF compliance getters
  get dateRegistered(): Date {
    return this.createdAt;
  }

  // Relationships
  @OneToOne(() => Agent, (agent) => agent.user)
  agentProfile?: Agent;

  @OneToMany(() => Property, (property) => property.owner)
  ownedProperties: Property[];

  @OneToMany(() => Inquiry, (inquiry) => inquiry.client)
  clientInquiries: Inquiry[];

  @OneToMany(() => Inquiry, (inquiry) => inquiry.assignedAgent)
  agentInquiries: Inquiry[];

  @OneToMany(() => Appointment, (appointment) => appointment.client)
  clientAppointments: Appointment[];

  @OneToMany(() => Appointment, (appointment) => appointment.agent)
  agentAppointments: Appointment[];

  @OneToMany(() => PropertyTransaction, (tx) => tx.buyer)
  buyerTransactions: PropertyTransaction[];
}
