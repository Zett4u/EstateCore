import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyType, ListingType, PropertyStatus } from '../../common/enums/property.enum';

export class CreatePropertyDto {
  @IsNotEmpty({ message: 'Title is required.' })
  @IsString()
  title: string;

  @IsNotEmpty({ message: 'Description is required.' })
  @IsString()
  description: string;

  @IsNotEmpty({ message: 'Property type is required.' })
  @IsEnum(PropertyType, { message: 'Invalid property type.' })
  propertyType: PropertyType;

  @IsNotEmpty({ message: 'Listing type is required.' })
  @IsEnum(ListingType, { message: 'Listing type must be SALE or RENT.' })
  listingType: ListingType;

  @IsNotEmpty({ message: 'Price is required.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Price must be a valid number.' })
  @IsPositive({ message: 'Price must be greater than zero.' })
  price: number;

  @IsNotEmpty({ message: 'Location is required.' })
  @IsString()
  location: string;

  @IsNotEmpty({ message: 'Address is required.' })
  @IsString()
  address: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  floorArea?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  lotArea?: number;

  @IsOptional()
  @IsEnum(PropertyStatus, { message: 'Invalid property status.' })
  status?: PropertyStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  agentId?: number;
}
