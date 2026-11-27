import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { Agent } from '../agents/entities/agent.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenBlacklistService } from './token-blacklist.service';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([Agent]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Enforce the academic PDF requirement: exactly 1 hour (3600s) token expiration
        const envExp = config.get<string>('JWT_EXPIRATION');
        const tokenExpiration = (!envExp || envExp === '86400s') ? '3600s' : envExp;

        const jwtSecret = config.get<string>('JWT_SECRET');
        if (!jwtSecret || jwtSecret.trim() === '') {
          throw new Error(
            'FATAL SECURITY CONFIGURATION ERROR: JWT_SECRET environment variable is missing or empty. ' +
            'The application refuses to start with an insecure or undefined signing key.',
          );
        }

        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: tokenExpiration,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokenBlacklistService],
  exports: [AuthService, JwtModule, PassportModule, TokenBlacklistService],
})
export class AuthModule {}
