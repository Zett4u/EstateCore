import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { AgentsService, AgentResponse } from './agents.service';
import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/role.enum';
import { User } from '../users/entities/user.entity';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  async findAll(): Promise<AgentResponse[]> {
    return this.agentsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<AgentResponse> {
    return this.agentsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createAgentDto: CreateAgentDto): Promise<AgentResponse> {
    return this.agentsService.create(createAgentDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updatePut(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAgentDto: UpdateAgentDto,
    @CurrentUser() currentUser: User,
  ): Promise<AgentResponse> {
    return this.update(id, updateAgentDto, currentUser);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAgentDto: UpdateAgentDto,
    @CurrentUser() currentUser: User,
  ): Promise<AgentResponse> {
    return this.agentsService.update(id, updateAgentDto, currentUser);
  }
}
