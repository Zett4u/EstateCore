import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../common/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { Agent } from '../agents/entities/agent.entity';

interface LoginAttemptTracker {
  count: number;
  firstAttemptAt: number;
  blockedUntil: number;
}

@Injectable()
export class AuthService {
  // In-memory brute force & rate limiting tracker (Lab 06 Security Measure 6)
  private readonly loginAttempts = new Map<string, LoginAttemptTracker>();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
  ) {}

  async register(registerDto: RegisterDto) {
    const existing = await this.usersService.findByEmail(registerDto.email);
    if (existing) {
      throw new ConflictException(`User with email '${registerDto.email}' already exists.`);
    }

    // Server-side security: Public registration is strictly restricted to CLIENT role
    const newUser = await this.usersService.create({
      fullName: registerDto.fullName,
      email: registerDto.email,
      password: registerDto.password,
      role: UserRole.CLIENT,
      isActive: true,
    });

    const payload = {
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Registration successful',
      accessToken,
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const emailKey = (loginDto.email || '').toLowerCase().trim();
    const now = Date.now();
    const tracker = this.loginAttempts.get(emailKey);

    // Rate limiting: 5 failed attempts in 10 minutes gives 429 Too Many Requests (Lab 06 Page 21)
    if (tracker && tracker.blockedUntil > now) {
      const waitSeconds = Math.ceil((tracker.blockedUntil - now) / 1000);
      throw new HttpException(
        `Too many failed login attempts. Account temporarily locked. Please try again in ${waitSeconds} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const recordFailedAttempt = () => {
      const current = this.loginAttempts.get(emailKey) || { count: 0, firstAttemptAt: now, blockedUntil: 0 };
      if (now - current.firstAttemptAt > 10 * 60 * 1000) {
        current.count = 1;
        current.firstAttemptAt = now;
        current.blockedUntil = 0;
      } else {
        current.count += 1;
      }
      if (current.count >= 5) {
        current.blockedUntil = now + 10 * 60 * 1000; // 10 minutes lockout
      }
      this.loginAttempts.set(emailKey, current);
    };

    const user = await this.usersService.findByEmail(loginDto.email, true);
    if (!user) {
      recordFailedAttempt();
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated. Please contact an administrator.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      recordFailedAttempt();
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Login successful: reset failed attempts
    this.loginAttempts.delete(emailKey);

    const payload: any = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Academic PDF compliance (Lab 06 Page 22): Agent token includes agentId
    if (user.role === UserRole.AGENT) {
      const agentProfile = await this.agentRepository.findOne({ where: { userId: user.id } });
      if (agentProfile) {
        payload.agentId = agentProfile.id;
      }
    }

    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  async getProfile(user: User) {
    return this.usersService.findOne(user.id);
  }
}
