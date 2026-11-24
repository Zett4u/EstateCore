import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private mapUserToAgent(user: User): AgentResponse {
    return {
      agentId: user.id,
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      licenseNumber: null, // Strictly unverified pending actual PRC credentials
      agencyName: 'EstateCore Realty Network',
      verificationStatus: 'PENDING_VERIFICATION',
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findAll(): Promise<AgentResponse[]> {
    const agentUsers = await this.userRepository.find({
      where: { role: UserRole.AGENT, isActive: true },
    });
    return agentUsers.map((u) => this.mapUserToAgent(u));
  }

  async findOne(id: number): Promise<AgentResponse> {
    const user = await this.userRepository.findOne({
      where: { id, role: UserRole.AGENT },
    });
    if (!user) {
      throw new NotFoundException(`Agent with ID ${id} was not found.`);
    }
    return this.mapUserToAgent(user);
  }

  async create(createAgentDto: CreateAgentDto): Promise<AgentResponse> {
    const targetUser = await this.userRepository.findOne({
      where: { id: createAgentDto.userId },
    });
    if (!targetUser) {
      throw new NotFoundException(`User with ID ${createAgentDto.userId} does not exist.`);
    }
    if (targetUser.role === UserRole.AGENT) {
      throw new ConflictException(`User ${targetUser.fullName} is already an authorized agent.`);
    }

    targetUser.role = UserRole.AGENT;
    const saved = await this.userRepository.save(targetUser);
    return this.mapUserToAgent(saved);
  }

  async update(id: number, updateAgentDto: UpdateAgentDto, currentUser: User): Promise<AgentResponse> {
    const agent = await this.findOne(id);
    // In Phase 1, metadata is returned cleanly matching PDF contract
    return {
      ...agent,
      agencyName: updateAgentDto.agencyName || agent.agencyName,
      licenseNumber: updateAgentDto.licenseNumber || agent.licenseNumber,
      updatedAt: new Date(),
    };
  }
}
