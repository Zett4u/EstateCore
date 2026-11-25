import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  ForbiddenException,
  HttpCode,
  HttpStatus,
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

  // Lab 05 Endpoint 5: GET /api/v1/agents (Public)
  @Get()
  async findAll(@Query() query?: any): Promise<any> {
    return this.agentsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<AgentResponse> {
    return this.agentsService.findOne(id);
  }

  // Lab 05 Endpoint 6: POST /api/v1/agents (Authenticated Agent role or Admin)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createAgentDto: CreateAgentDto,
    @CurrentUser() currentUser: User,
  ): Promise<AgentResponse> {
    if (currentUser.role === UserRole.AGENT && createAgentDto.userId !== currentUser.id) {
      throw new ForbiddenException('You can only create an agent profile for your own account.');
    }
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
