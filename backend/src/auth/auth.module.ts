import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenBlacklistService } from './token-blacklist.service';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Enforce the academic PDF requirement: exactly 1 hour (3600s) token expiration
        const envExp = config.get<string>('JWT_EXPIRATION');
        const tokenExpiration = (!envExp || envExp === '86400s') ? '3600s' : envExp;

        return {
          secret: config.get<string>('JWT_SECRET') || 'estatecore_super_secret_jwt_key_2026_academic_defense_key',
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
