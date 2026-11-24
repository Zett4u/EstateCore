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
import { Inquiry } from '../../inquiries/entities/inquiry.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn()
  id: number;

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

  @ManyToOne(() => User, (user) => user.properties, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'agentId' })
  agent: User | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relationships
  @OneToMany(() => Inquiry, (inquiry) => inquiry.property)
  inquiries: Inquiry[];

  @OneToMany(() => Appointment, (appointment) => appointment.property)
  appointments: Appointment[];
}
