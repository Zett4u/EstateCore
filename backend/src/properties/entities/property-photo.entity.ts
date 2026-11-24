import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Property } from './property.entity';

@Entity('property_photos')
export class PropertyPhoto {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  propertyId: number;

  @ManyToOne(() => Property, (property) => property.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column({ type: 'varchar', length: 500 })
  filePath: string;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  caption: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
