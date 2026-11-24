import { IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';

export class CreateAgentDto {
  @IsNotEmpty()
  userId: number;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  agencyName?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class UpdateAgentDto {
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  agencyName?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
