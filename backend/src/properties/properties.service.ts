import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, Like } from 'typeorm';
import { Property } from './entities/property.entity';
import { PropertyPhoto } from './entities/property-photo.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertyDto } from './dto/query-property.dto';
import { User } from '../users/entities/user.entity';
import { Agent } from '../agents/entities/agent.entity';
import { UserRole } from '../common/enums/role.enum';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(PropertyPhoto)
    private readonly photoRepository: Repository<PropertyPhoto>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
  ) {}

  private async validateAgent(agentId: number): Promise<User> {
    const agent = await this.userRepository.findOne({ where: { id: agentId } });
    if (!agent) {
      throw new BadRequestException(`Assigned agent with ID ${agentId} does not exist.`);
    }
    if (agent.role !== UserRole.AGENT && agent.role !== UserRole.ADMIN) {
      throw new BadRequestException(`User '${agent.fullName}' (ID ${agentId}) is a CLIENT and cannot be assigned as a property agent.`);
    }
    if (!agent.isActive) {
      throw new BadRequestException(`Agent '${agent.fullName}' (ID ${agentId}) is deactivated.`);
    }
    return agent;
  }

  async create(createPropertyDto: CreatePropertyDto, user: User): Promise<Property> {
    let assignedAgentId = user.id;

    if (user.role === UserRole.ADMIN && createPropertyDto.agentId) {
      await this.validateAgent(createPropertyDto.agentId);
      assignedAgentId = createPropertyDto.agentId;
    } else if (user.role === UserRole.AGENT) {
      assignedAgentId = user.id; // Strictly force agent's own ID
    }

    const property = this.propertyRepository.create({
      ...createPropertyDto,
      agentId: assignedAgentId,
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

    if (user.role === UserRole.ADMIN && updatePropertyDto.agentId && updatePropertyDto.agentId !== property.agentId) {
      await this.validateAgent(updatePropertyDto.agentId);
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

  async addPhoto(id: number, photoDto: any, user: User) {
    const property = await this.findOne(id);
    if (user.role === UserRole.AGENT) {
      // Find the agent profile corresponding to current user
      const agentProfile = await this.agentRepository.findOne({ where: { userId: user.id } });
      const isOwner = property.agentId === user.id || (agentProfile && property.agentId === agentProfile.id);
      if (!isOwner) {
        throw new ForbiddenException('You are not authorized to upload photos to listings assigned to other agents.');
      }
    }

    const filePath = photoDto?.filePath || photoDto?.photoUrl || `https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80`;
    const isPrimary = photoDto?.isPrimary !== undefined ? Boolean(photoDto.isPrimary) : false;
    const caption = photoDto?.caption || null;

    const photo = this.photoRepository.create({
      propertyId: id,
      filePath,
      isPrimary,
      caption,
    });
    const saved = await this.photoRepository.save(photo);

    return {
      photoId: saved.id,
      propertyId: saved.propertyId,
      filePath: saved.filePath,
      photoUrl: saved.filePath, // Backward compatibility for frontend
      isPrimary: saved.isPrimary,
      caption: saved.caption,
      createdAt: saved.createdAt,
      uploadDate: saved.createdAt,
    };
  }
}
