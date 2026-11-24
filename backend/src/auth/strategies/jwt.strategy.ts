import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import { TokenBlacklistService } from '../token-blacklist.service';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'estatecore_super_secret_jwt_key_2026_academic_defense_key',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    // 1. Check if token is present on blacklist (revoked via logout)
    const rawToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (rawToken && this.tokenBlacklistService.isRevoked(rawToken)) {
      throw new UnauthorizedException('Authentication token has been revoked / logged out.');
    }

    // 2. Validate user identity and active status in database
    const user = await this.usersService.findOne(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is inactive or no longer exists.');
    }
    return user;
  }
}
