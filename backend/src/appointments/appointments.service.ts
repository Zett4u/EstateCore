import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/create-appointment.dto';
import { Property } from '../properties/entities/property.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/role.enum';
import { AppointmentStatus } from '../common/enums/appointment.enum';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
  ) {}

  private validateNotPast(dateStr: string, timeStr: string) {
    const appointmentDateTime = new Date(`${dateStr}T${timeStr}:00`);
    const now = new Date();
    if (appointmentDateTime.getTime() < now.getTime()) {
      throw new BadRequestException('Appointment date and time cannot be in the past.');
    }
  }

  private async checkAgentConflict(agentId: number, dateStr: string, timeStr: string, excludeId?: number) {
    const qb = this.appointmentRepository.createQueryBuilder('appointment')
      .where('appointment.agentId = :agentId', { agentId })
      .andWhere('appointment.appointmentDate = :dateStr', { dateStr })
      .andWhere('appointment.appointmentTime = :timeStr', { timeStr })
      .andWhere('appointment.status = :status', { status: AppointmentStatus.CONFIRMED });

    if (excludeId) {
      qb.andWhere('appointment.id != :excludeId', { excludeId });
    }

    const conflict = await qb.getOne();
    if (conflict) {
      throw new ConflictException(
        `The assigned agent already has a confirmed viewing appointment scheduled at ${timeStr} on ${dateStr}.`,
      );
    }
  }

  async create(createAppointmentDto: CreateAppointmentDto, user: User): Promise<Appointment> {
    this.validateNotPast(createAppointmentDto.appointmentDate, createAppointmentDto.appointmentTime);

    const property = await this.propertyRepository.findOne({
      where: { id: createAppointmentDto.propertyId },
    });
    if (!property) {
      throw new NotFoundException(`Property with ID ${createAppointmentDto.propertyId} not found.`);
    }

    const agentId = createAppointmentDto.agentId || property.agentId;
    if (!agentId) {
      throw new BadRequestException('This property does not have an assigned agent. Please contact support.');
    }

    await this.checkAgentConflict(agentId, createAppointmentDto.appointmentDate, createAppointmentDto.appointmentTime);

    const clientId = user.role === UserRole.CLIENT ? user.id : (user.id);

    const appointment = this.appointmentRepository.create({
      propertyId: property.id,
      clientId,
      agentId,
      appointmentDate: createAppointmentDto.appointmentDate,
      appointmentTime: createAppointmentDto.appointmentTime,
      notes: createAppointmentDto.notes || null,
      status: AppointmentStatus.PENDING,
    });

    const saved = await this.appointmentRepository.save(appointment);
    return this.findOne(saved.id, user);
  }

  async findAll(user: User): Promise<Appointment[]> {
    const qb = this.appointmentRepository.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.property', 'property')
      .leftJoinAndSelect('appointment.client', 'client')
      .leftJoinAndSelect('appointment.agent', 'agent')
      .select([
        'appointment.id',
        'appointment.propertyId',
        'appointment.clientId',
        'appointment.agentId',
        'appointment.appointmentDate',
        'appointment.appointmentTime',
        'appointment.status',
        'appointment.notes',
        'appointment.createdAt',
        'appointment.updatedAt',
        'property.id',
        'property.title',
        'property.location',
        'property.address',
        'property.price',
        'client.id',
        'client.fullName',
        'client.email',
        'agent.id',
        'agent.fullName',
        'agent.email',
      ]);

    if (user.role === UserRole.CLIENT) {
      qb.andWhere('appointment.clientId = :clientId', { clientId: user.id });
    } else if (user.role === UserRole.AGENT) {
      qb.andWhere('appointment.agentId = :agentId', { agentId: user.id });
    }
    // ADMIN gets all

    return qb.orderBy('appointment.appointmentDate', 'ASC')
      .addOrderBy('appointment.appointmentTime', 'ASC')
      .getMany();
  }

  async findOne(id: number, user: User): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['property', 'client', 'agent'],
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found.`);
    }

    if (user.role === UserRole.CLIENT && appointment.clientId !== user.id) {
      throw new ForbiddenException('You are not authorized to view appointments for other clients.');
    }
    if (user.role === UserRole.AGENT && appointment.agentId !== user.id) {
      throw new ForbiddenException('You are not authorized to view appointments for other agents.');
    }

    if (appointment.client) delete (appointment.client as any).password;
    if (appointment.agent) delete (appointment.agent as any).password;

    return appointment;
  }

  async update(id: number, updateDto: UpdateAppointmentDto, user: User): Promise<Appointment> {
    const appointment = await this.findOne(id, user);

    const targetDate = updateDto.appointmentDate || appointment.appointmentDate;
    const targetTime = updateDto.appointmentTime || appointment.appointmentTime;
    const targetAgentId = updateDto.agentId || appointment.agentId;

    if (updateDto.appointmentDate || updateDto.appointmentTime) {
      this.validateNotPast(targetDate, targetTime);
    }

    if (updateDto.status === AppointmentStatus.CONFIRMED || (appointment.status === AppointmentStatus.CONFIRMED && (updateDto.appointmentDate || updateDto.appointmentTime))) {
      await this.checkAgentConflict(targetAgentId, targetDate, targetTime, appointment.id);
    }

    if (user.role === UserRole.CLIENT) {
      if (updateDto.status && updateDto.status !== AppointmentStatus.CANCELLED) {
        throw new ForbiddenException('Clients can only cancel an appointment, not alter approval status.');
      }
      if (updateDto.notes !== undefined) appointment.notes = updateDto.notes;
      if (updateDto.status) appointment.status = updateDto.status;
    } else {
      // Agent or Admin
      if (updateDto.status) appointment.status = updateDto.status;
      if (updateDto.appointmentDate) appointment.appointmentDate = updateDto.appointmentDate;
      if (updateDto.appointmentTime) appointment.appointmentTime = updateDto.appointmentTime;
      if (updateDto.notes !== undefined) appointment.notes = updateDto.notes;
      if (updateDto.agentId && user.role === UserRole.ADMIN) {
        appointment.agentId = updateDto.agentId;
      }
    }

    await this.appointmentRepository.save(appointment);
    return this.findOne(id, user);
  }

  async remove(id: number, user: User): Promise<{ message: string; id: number }> {
    const appointment = await this.findOne(id, user);

    if (user.role !== UserRole.ADMIN && appointment.clientId !== user.id) {
      throw new ForbiddenException('You are only authorized to delete your own appointment.');
    }

    await this.appointmentRepository.remove(appointment);
    return {
      message: `Appointment ID ${id} deleted successfully.`,
      id,
    };
  }
}
