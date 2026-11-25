import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @IsNotEmpty({ message: 'Property ID is required.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Property ID must be a number.' })
  propertyId: number;

  @IsNotEmpty({ message: 'Buyer ID is required.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Buyer ID must be a number.' })
  buyerId: number;

  @IsNotEmpty({ message: 'Amount is required.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Amount must be a valid number.' })
  @IsPositive({ message: 'Amount must be greater than 0.' })
  amount: number;

  @IsNotEmpty({ message: 'Transaction type is required.' })
  @IsString()
  transactionType: string;

  @IsNotEmpty({ message: 'Payment method is required.' })
  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  transactionDate?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
