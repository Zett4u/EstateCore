import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inquiry } from './entities/inquiry.entity';
import { CreateInquiryDto, UpdateInquiryDto } from './dto/create-inquiry.dto';
import { Property } from '../properties/entities/property.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/role.enum';

@Injectable()
export class InquiriesService {
  constructor(
    @InjectRepository(Inquiry)
    private readonly inquiryRepository: Repository<Inquiry>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
  ) {}

  async create(createInquiryDto: CreateInquiryDto, user: User): Promise<Inquiry> {
    if (!createInquiryDto.propertyId) {
      throw new BadRequestException('Property ID is required.');
    }

    const property = await this.propertyRepository.findOne({
      where: { id: createInquiryDto.propertyId },
    });
    if (!property) {
      throw new NotFoundException(`Property with ID ${createInquiryDto.propertyId} does not exist.`);
    }

    const assignedAgentId = createInquiryDto.assignedAgentId || property.agentId || null;

    const inquiry = this.inquiryRepository.create({
      clientId: user.id,
      propertyId: property.id,
      assignedAgentId,
      subject: createInquiryDto.subject,
      message: createInquiryDto.message,
      contactNumber: createInquiryDto.contactNumber,
    });

    const saved = await this.inquiryRepository.save(inquiry);
    return this.findOne(saved.id, user);
  }

  async findAll(user: User): Promise<Inquiry[]> {
    const qb = this.inquiryRepository.createQueryBuilder('inquiry')
      .leftJoinAndSelect('inquiry.client', 'client')
      .leftJoinAndSelect('inquiry.property', 'property')
      .leftJoinAndSelect('inquiry.assignedAgent', 'assignedAgent')
      .select([
        'inquiry.id',
        'inquiry.clientId',
        'inquiry.propertyId',
        'inquiry.assignedAgentId',
        'inquiry.subject',
        'inquiry.message',
        'inquiry.contactNumber',
        'inquiry.status',
        'inquiry.createdAt',
        'inquiry.updatedAt',
        'client.id',
        'client.fullName',
        'client.email',
        'property.id',
        'property.title',
        'property.price',
        'property.location',
        'assignedAgent.id',
        'assignedAgent.fullName',
        'assignedAgent.email',
      ]);

    if (user.role === UserRole.CLIENT) {
      qb.andWhere('inquiry.clientId = :clientId', { clientId: user.id });
    } else if (user.role === UserRole.AGENT) {
      qb.andWhere('inquiry.assignedAgentId = :agentId', { agentId: user.id });
    }
    // ADMIN sees all

    return qb.orderBy('inquiry.createdAt', 'DESC').getMany();
  }

  async findOne(id: number, user: User): Promise<Inquiry> {
    const inquiry = await this.inquiryRepository.findOne({
      where: { id },
      relations: ['client', 'property', 'assignedAgent'],
    });

    if (!inquiry) {
      throw new NotFoundException(`Inquiry with ID ${id} not found.`);
    }

    // Role-based visibility check
    if (user.role === UserRole.CLIENT && inquiry.clientId !== user.id) {
      throw new ForbiddenException('You are not authorized to view inquiries from other clients.');
    }
    if (user.role === UserRole.AGENT && inquiry.assignedAgentId !== user.id) {
      throw new ForbiddenException('You are not authorized to view inquiries assigned to other agents.');
    }

    if (inquiry.client) delete (inquiry.client as any).password;
    if (inquiry.assignedAgent) delete (inquiry.assignedAgent as any).password;

    return inquiry;
  }

  async update(id: number, updateInquiryDto: UpdateInquiryDto, user: User): Promise<Inquiry> {
    const inquiry = await this.findOne(id, user);

    if (user.role === UserRole.CLIENT) {
      // Client can only edit content if status is still PENDING
      if (inquiry.status !== 'PENDING') {
        throw new BadRequestException('Cannot modify an inquiry that is already being processed.');
      }
      if (updateInquiryDto.subject) inquiry.subject = updateInquiryDto.subject;
      if (updateInquiryDto.message) inquiry.message = updateInquiryDto.message;
      if (updateInquiryDto.contactNumber) inquiry.contactNumber = updateInquiryDto.contactNumber;
    } else if (user.role === UserRole.AGENT) {
      // Agent can update status
      if (updateInquiryDto.status) inquiry.status = updateInquiryDto.status;
    } else if (user.role === UserRole.ADMIN) {
      // Admin can update status and reassign agent
      if (updateInquiryDto.status) inquiry.status = updateInquiryDto.status;
      if (updateInquiryDto.assignedAgentId !== undefined) {
        inquiry.assignedAgentId = updateInquiryDto.assignedAgentId;
      }
    }

    await this.inquiryRepository.save(inquiry);
    return this.findOne(id, user);
  }

  async remove(id: number, user: User): Promise<{ message: string; id: number }> {
    const inquiry = await this.findOne(id, user);

    if (user.role !== UserRole.ADMIN && inquiry.clientId !== user.id) {
      throw new ForbiddenException('You can only delete your own inquiries.');
    }

    await this.inquiryRepository.remove(inquiry);
    return {
      message: `Inquiry ID ${id} deleted successfully.`,
      id,
    };
  }
}
