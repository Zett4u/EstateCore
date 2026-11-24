import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentStatus } from '../../common/enums/appointment.enum';

export class CreateAppointmentDto {
  @IsNotEmpty({ message: 'Property ID is required.' })
  @Type(() => Number)
  @IsNumber()
  propertyId: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  agentId?: number;

  @IsNotEmpty({ message: 'Appointment date is required (YYYY-MM-DD).' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date format must be YYYY-MM-DD.' })
  appointmentDate: string;

  @IsNotEmpty({ message: 'Appointment time is required (HH:MM).' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Time format must be HH:MM (24-hour).' })
  appointmentTime: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsEnum(AppointmentStatus, { message: 'Invalid appointment status.' })
  status?: AppointmentStatus;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date format must be YYYY-MM-DD.' })
  appointmentDate?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Time format must be HH:MM (24-hour).' })
  appointmentTime?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  agentId?: number;
}
