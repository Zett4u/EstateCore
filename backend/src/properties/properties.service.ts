import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, Like } from 'typeorm';
import { Property } from './entities/property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertyDto } from './dto/query-property.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/role.enum';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
  ) {}

  async create(createPropertyDto: CreatePropertyDto, user: User): Promise<Property> {
    const property = this.propertyRepository.create({
      ...createPropertyDto,
      agentId: user.role === UserRole.AGENT ? user.id : createPropertyDto.agentId || user.id,
    });
    return this.propertyRepository.save(property);
  }

  async findAll(query: QueryPropertyDto): Promise<Property[]> {
    const qb = this.propertyRepository.createQueryBuilder('property')
      .leftJoinAndSelect('property.agent', 'agent')
      .select([
        'property.id',
        'property.title',
        'property.description',
        'property.propertyType',
        'property.listingType',
        'property.price',
        'property.location',
        'property.address',
        'property.bedrooms',
        'property.bathrooms',
        'property.floorArea',
        'property.lotArea',
        'property.status',
        'property.agentId',
        'property.createdAt',
        'property.updatedAt',
        'agent.id',
        'agent.fullName',
        'agent.email',
      ]);

    if (query.search) {
      qb.andWhere(
        '(property.title LIKE :search OR property.description LIKE :search OR property.location LIKE :search OR property.address LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.propertyType) {
      qb.andWhere('property.propertyType = :propertyType', { propertyType: query.propertyType });
    }

    if (query.listingType) {
      qb.andWhere('property.listingType = :listingType', { listingType: query.listingType });
    }

    if (query.status) {
      qb.andWhere('property.status = :status', { status: query.status });
    }

    if (query.location) {
      qb.andWhere('property.location LIKE :loc', { loc: `%${query.location}%` });
    }

    if (query.agentId) {
      qb.andWhere('property.agentId = :agentId', { agentId: query.agentId });
    }

    if (query.minPrice !== undefined && query.maxPrice !== undefined) {
      qb.andWhere('property.price BETWEEN :minPrice AND :maxPrice', {
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
      });
    } else if (query.minPrice !== undefined) {
      qb.andWhere('property.price >= :minPrice', { minPrice: query.minPrice });
    } else if (query.maxPrice !== undefined) {
      qb.andWhere('property.price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    return qb.orderBy('property.createdAt', 'DESC').getMany();
  }

  async findOne(id: number): Promise<Property> {
    const property = await this.propertyRepository.findOne({
      where: { id },
      relations: ['agent'],
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found.`);
    }

    if (property.agent) {
      delete (property.agent as any).password;
    }

    return property;
  }

  async update(id: number, updatePropertyDto: UpdatePropertyDto, user: User): Promise<Property> {
    const property = await this.findOne(id);

    // Ownership check: Admin can update any, Agent only their assigned listings
    if (user.role === UserRole.AGENT && property.agentId !== user.id) {
      throw new ForbiddenException('You are not authorized to update properties assigned to other agents.');
    }

    if (user.role !== UserRole.ADMIN && updatePropertyDto.agentId && updatePropertyDto.agentId !== property.agentId) {
      throw new ForbiddenException('Only administrators can reassign properties to a different agent.');
    }

    Object.assign(property, updatePropertyDto);
    return this.propertyRepository.save(property);
  }

  async remove(id: number, user: User): Promise<{ message: string; id: number }> {
    const property = await this.findOne(id);

    if (user.role === UserRole.AGENT && property.agentId !== user.id) {
      throw new ForbiddenException('You are not authorized to delete properties assigned to other agents.');
    }

    await this.propertyRepository.remove(property);
    return {
      message: `Property ID ${id} ('${property.title}') deleted successfully.`,
      id,
    };
  }
}
