import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Agent, AgentVerificationStatus } from './entities/agent.entity';
import { UserRole } from '../common/enums/role.enum';
import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';

export interface AgentResponse {
  agentId: number;
  userId: number;
  fullName: string;
  email: string;
  licenseNumber: string | null;
  agencyName: string;
  verificationStatus: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private mapAgentToResponse(agent: Agent): AgentResponse {
    return {
      agentId: agent.id,
      userId: agent.userId,
      fullName: agent.user ? agent.user.fullName : '',
      email: agent.user ? agent.user.email : '',
      licenseNumber: agent.licenseNumber,
      agencyName: agent.agencyName || 'Independent',
      verificationStatus: agent.verificationStatus,
      isActive: agent.user ? agent.user.isActive : true,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    };
  }

  async findAll(): Promise<AgentResponse[]> {
    const agents = await this.agentRepository.find({
      relations: ['user'],
      order: { id: 'ASC' },
    });
    return agents.map((a) => this.mapAgentToResponse(a));
  }

  async findOne(id: number): Promise<AgentResponse> {
    const agent = await this.agentRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} was not found.`);
    }
    return this.mapAgentToResponse(agent);
  }

  async create(createAgentDto: CreateAgentDto): Promise<AgentResponse> {
    const targetUser = await this.userRepository.findOne({
      where: { id: createAgentDto.userId },
    });
    if (!targetUser) {
      throw new NotFoundException(`User with ID ${createAgentDto.userId} does not exist.`);
    }

    const existingAgent = await this.agentRepository.findOne({
      where: { userId: createAgentDto.userId },
    });
    if (existingAgent) {
      throw new ConflictException(`User ${targetUser.fullName} already has an Agent profile.`);
    }

    targetUser.role = UserRole.AGENT;
    await this.userRepository.save(targetUser);

    const newAgent = this.agentRepository.create({
      userId: targetUser.id,
      licenseNumber: createAgentDto.licenseNumber || null,
      agencyName: createAgentDto.agencyName || 'EstateCore Realty',
      verificationStatus: AgentVerificationStatus.PENDING_VERIFICATION,
    });
    const saved = await this.agentRepository.save(newAgent);
    saved.user = targetUser;
    return this.mapAgentToResponse(saved);
  }

  async update(id: number, updateAgentDto: UpdateAgentDto, currentUser: User): Promise<AgentResponse> {
    const agent = await this.agentRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} was not found.`);
    }

    if (updateAgentDto.agencyName !== undefined) {
      agent.agencyName = updateAgentDto.agencyName;
    }
    if (updateAgentDto.licenseNumber !== undefined) {
      agent.licenseNumber = updateAgentDto.licenseNumber;
    }

    const saved = await this.agentRepository.save(agent);
    return this.mapAgentToResponse(saved);
  }
}
