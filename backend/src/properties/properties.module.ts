import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from './entities/property.entity';
import { PropertyPhoto } from './entities/property-photo.entity';
import { User } from '../users/entities/user.entity';
import { Agent } from '../agents/entities/agent.entity';
import { InquiriesModule } from '../inquiries/inquiries.module';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, PropertyPhoto, User, Agent]),
    InquiriesModule,
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
