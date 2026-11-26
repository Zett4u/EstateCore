import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { InquiryStatus } from '../../common/enums/inquiry.enum';
import { InquiryType } from '../entities/inquiry.entity';

export class CreateInquiryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Property ID must be a number.' })
  propertyId?: number;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsNotEmpty({ message: 'Message is required.' })
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  contactNumber?: string;

  @IsOptional()
  @IsString()
  inquiryType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Offer amount must be a number.' })
  @IsPositive({ message: 'Offer amount must be greater than 0.' })
  offerAmount?: number;

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

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offerAmount?: number;
}
