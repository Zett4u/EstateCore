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

  private async validateAgent(agentId: number): Promise<Agent> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
      relations: ['user'],
    });
    if (!agent) {
      throw new BadRequestException(`Assigned agent with ID ${agentId} does not exist.`);
    }
    if (agent.user && !agent.user.isActive) {
      throw new BadRequestException(`Agent with ID ${agentId} is deactivated.`);
    }
    return agent;
  }

  private deriveCity(location: string): string {
    if (!location) return '';
    if (location.includes('Taguig') || location.includes('BGC')) return 'Taguig';
    if (location.includes('Makati')) return 'Makati';
    if (location.includes('Muntinlupa') || location.includes('Alabang')) return 'Muntinlupa';
    if (location.includes('Quezon')) return 'Quezon City';
    if (location.includes('San Juan')) return 'San Juan City';
    if (location.includes('Cavite')) return 'Cavite';
    if (location.includes('Batangas')) return 'Batangas';
    return location;
  }

  async create(createPropertyDto: CreatePropertyDto, user: User): Promise<Property> {
    let assignedAgentId: number | null = null;
    let ownerId: number | null = null;

    if (user.role === UserRole.ADMIN) {
      if (createPropertyDto.agentId) {
        await this.validateAgent(createPropertyDto.agentId);
        assignedAgentId = createPropertyDto.agentId;
      }
      ownerId = createPropertyDto.ownerId || null;
    } else if (user.role === UserRole.AGENT) {
      const agentProfile = await this.agentRepository.findOne({ where: { userId: user.id } });
      if (!agentProfile) {
        throw new ForbiddenException('You do not have an active professional Agent profile.');
      }
      assignedAgentId = agentProfile.id;
      ownerId = createPropertyDto.ownerId || null;
    } else if (user.role === UserRole.CLIENT) {
      // Property Owner capability: Client owns their created listing
      ownerId = user.id;
      if (createPropertyDto.agentId) {
        await this.validateAgent(createPropertyDto.agentId);
        assignedAgentId = createPropertyDto.agentId;
      } else {
        assignedAgentId = null;
      }
    }

    const city = createPropertyDto.city || this.deriveCity(createPropertyDto.location);

    const property = this.propertyRepository.create({
      ...createPropertyDto,
      agentId: assignedAgentId,
      ownerId,
      city,
    });
    return this.propertyRepository.save(property);
  }

  async findAll(query: QueryPropertyDto): Promise<Property[]> {
    const qb = this.propertyRepository.createQueryBuilder('property')
      .leftJoinAndSelect('property.agent', 'agent')
      .leftJoinAndSelect('agent.user', 'agentUser')
      .leftJoinAndSelect('property.photos', 'photos')
      .leftJoinAndSelect('property.owner', 'owner');

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

    const properties = await qb.orderBy('property.createdAt', 'DESC').getMany();
    return properties.map((p) => {
      if (p.agent && (p.agent as any).user) {
        delete (p.agent as any).user.password;
      }
      if (p.owner) {
        delete (p.owner as any).password;
      }
      return p;
    });
  }

  async findOne(id: number): Promise<Property> {
    const property = await this.propertyRepository.findOne({
      where: { id },
      relations: ['agent', 'agent.user', 'photos', 'owner'],
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found.`);
    }

    if (property.agent && (property.agent as any).user) {
      delete (property.agent as any).user.password;
    }
    if (property.owner) {
      delete (property.owner as any).password;
    }

    return property;
  }

  async update(id: number, updatePropertyDto: UpdatePropertyDto, user: User): Promise<Property> {
    const property = await this.findOne(id);

    if (user.role === UserRole.ADMIN) {
      // Admin can update everything and reassign agent or owner
      if (updatePropertyDto.agentId !== undefined && updatePropertyDto.agentId !== property.agentId) {
        if (updatePropertyDto.agentId !== null) {
          await this.validateAgent(updatePropertyDto.agentId);
        }
      }
      if (updatePropertyDto.ownerId !== undefined && updatePropertyDto.ownerId !== property.ownerId) {
        if (updatePropertyDto.ownerId !== null) {
          const owner = await this.userRepository.findOne({ where: { id: updatePropertyDto.ownerId } });
          if (!owner) {
            throw new BadRequestException(`Owner with ID ${updatePropertyDto.ownerId} does not exist.`);
          }
        }
      }
    } else if (user.role === UserRole.AGENT) {
      // Agent can only update listings assigned to them
      const agentProfile = await this.agentRepository.findOne({ where: { userId: user.id } });
      if (!agentProfile || property.agentId !== agentProfile.id) {
        throw new ForbiddenException('You are not authorized to update properties assigned to other agents.');
      }
      if (updatePropertyDto.agentId !== undefined && updatePropertyDto.agentId !== property.agentId) {
        throw new ForbiddenException('Only administrators can reassign properties to a different agent.');
      }
      if (updatePropertyDto.ownerId !== undefined && updatePropertyDto.ownerId !== property.ownerId) {
        throw new ForbiddenException('Only administrators can reassign property owners.');
      }
      delete updatePropertyDto.agentId;
      delete updatePropertyDto.ownerId;
    } else if (user.role === UserRole.CLIENT) {
      // Client / Property Owner can only update listings they own
      if (property.ownerId !== user.id) {
        throw new ForbiddenException('You are not authorized to update properties owned by other users.');
      }
      if (updatePropertyDto.agentId !== undefined && updatePropertyDto.agentId !== property.agentId) {
        throw new ForbiddenException('Only administrators can reassign properties to a different agent.');
      }
      if (updatePropertyDto.ownerId !== undefined && updatePropertyDto.ownerId !== property.ownerId) {
        throw new ForbiddenException('Only administrators can reassign property owners.');
      }
      delete updatePropertyDto.agentId;
      delete updatePropertyDto.ownerId;
    }

    if (updatePropertyDto.location && !updatePropertyDto.city) {
      updatePropertyDto.city = this.deriveCity(updatePropertyDto.location);
    }

    Object.assign(property, updatePropertyDto);
    return this.propertyRepository.save(property);
  }

  async remove(id: number, user: User): Promise<{ message: string; id: number }> {
    const property = await this.findOne(id);

    if (user.role === UserRole.ADMIN) {
      // Admin can remove any
    } else if (user.role === UserRole.AGENT) {
      const agentProfile = await this.agentRepository.findOne({ where: { userId: user.id } });
      if (!agentProfile || property.agentId !== agentProfile.id) {
        throw new ForbiddenException('You are not authorized to delete properties assigned to other agents.');
      }
    } else if (user.role === UserRole.CLIENT) {
      if (property.ownerId !== user.id) {
        throw new ForbiddenException('You are not authorized to delete properties owned by other users.');
      }
    }

    await this.propertyRepository.remove(property);
    return {
      message: `Property ID ${id} ('${property.title}') deleted successfully.`,
      id,
    };
  }

  async addPhoto(id: number, photoDto: any, user: User) {
    const property = await this.findOne(id);

    if (user.role === UserRole.ADMIN) {
      // Admin can add photo to any listing
    } else if (user.role === UserRole.AGENT) {
      const agentProfile = await this.agentRepository.findOne({ where: { userId: user.id } });
      if (!agentProfile || property.agentId !== agentProfile.id) {
        throw new ForbiddenException('You are not authorized to upload photos to listings assigned to other agents.');
      }
    } else if (user.role === UserRole.CLIENT) {
      if (property.ownerId !== user.id) {
        throw new ForbiddenException('You are not authorized to upload photos to properties owned by other users.');
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
