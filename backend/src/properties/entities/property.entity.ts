import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { PropertyType, ListingType, PropertyStatus } from '../../common/enums/property.enum';
import { User } from '../../users/entities/user.entity';
import { Agent } from '../../agents/entities/agent.entity';
import { Inquiry } from '../../inquiries/entities/inquiry.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { PropertyPhoto } from './property-photo.entity';
import { PropertyTransaction } from '../../transactions/entities/property-transaction.entity';

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  ownerId: number | null;

  @ManyToOne(() => User, (user) => user.ownedProperties, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'ownerId' })
  owner: User | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Index()
  @Column({
    type: 'enum',
    enum: PropertyType,
  })
  propertyType: PropertyType;

  @Index()
  @Column({
    type: 'enum',
    enum: ListingType,
  })
  listingType: ListingType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Index()
  @Column({ type: 'varchar', length: 150 })
  location: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ type: 'int', default: 1 })
  bedrooms: number;

  @Column({ type: 'int', default: 1 })
  bathrooms: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  floorArea: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  lotArea: number;

  @Index()
  @Column({
    type: 'enum',
    enum: PropertyStatus,
    default: PropertyStatus.AVAILABLE,
  })
  status: PropertyStatus;

  @Column({ type: 'int', nullable: true })
  agentId: number | null;

  @ManyToOne(() => Agent, (agent) => agent.properties, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'agentId' })
  agent: Agent | null;

  get assignedAgent(): Agent | null {
    return this.agent;
  }

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Academic PDF compliance getter
  get dateListed(): Date {
    return this.createdAt;
  }

  // Relationships
  @OneToMany(() => Inquiry, (inquiry) => inquiry.property)
  inquiries: Inquiry[];

  @OneToMany(() => Appointment, (appointment) => appointment.property)
  appointments: Appointment[];

  @OneToMany(() => PropertyPhoto, (photo) => photo.property)
  photos: PropertyPhoto[];

  @OneToMany(() => PropertyTransaction, (tx) => tx.property)
  transactions: PropertyTransaction[];
}
