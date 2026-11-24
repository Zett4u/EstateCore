import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { InquiryStatus } from '../../common/enums/inquiry.enum';

export class CreateInquiryDto {
  @IsNotEmpty({ message: 'Property ID is required.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Property ID must be a number.' })
  propertyId: number;

  @IsNotEmpty({ message: 'Subject is required.' })
  @IsString()
  subject: string;

  @IsNotEmpty({ message: 'Message is required.' })
  @IsString()
  message: string;

  @IsNotEmpty({ message: 'Contact number is required.' })
  @IsString()
  contactNumber: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  assignedAgentId?: number;
}

export class UpdateInquiryDto {
  @IsOptional()
  @IsEnum(InquiryStatus, { message: 'Invalid inquiry status.' })
  status?: InquiryStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  assignedAgentId?: number;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  contactNumber?: string;
}
