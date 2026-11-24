import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PropertiesModule } from './properties/properties.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { User } from './users/entities/user.entity';
import { Property } from './properties/entities/property.entity';
import { Inquiry } from './inquiries/entities/inquiry.entity';
import { Appointment } from './appointments/entities/appointment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', '127.0.0.1'),
        port: parseInt(config.get<string>('DB_PORT', '3307'), 10),
        username: config.get<string>('DB_USERNAME', 'estatecore_user'),
        password: config.get<string>('DB_PASSWORD', 'estatecore_secure_pass_2026'),
        database: config.get<string>('DB_NAME', 'estatecore_db'),
        entities: [User, Property, Inquiry, Appointment],
        synchronize: false, // Schema managed via TypeORM migrations
        autoLoadEntities: true,
        logging: config.get<string>('NODE_ENV') === 'development' ? ['error', 'warn'] : false,
      }),
    }),
    UsersModule,
    AuthModule,
    PropertiesModule,
    InquiriesModule,
    AppointmentsModule,
  ],
})
export class AppModule {}
