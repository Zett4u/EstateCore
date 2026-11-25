import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<any> {
    const existing = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existing) {
      throw new ConflictException(`User with email '${createUserDto.email}' already exists.`);
    }

    if (!createUserDto.fullName && (createUserDto.firstName || createUserDto.lastName)) {
      createUserDto.fullName = `${createUserDto.firstName || ''} ${createUserDto.lastName || ''}`.trim();
    }
    if (!createUserDto.fullName) {
      createUserDto.fullName = createUserDto.email.split('@')[0];
    }

    let role = UserRole.CLIENT;
    if (createUserDto.role) {
      const r = createUserDto.role.toUpperCase();
      if (r === 'ADMIN') role = UserRole.ADMIN;
      else if (r === 'AGENT') role = UserRole.AGENT;
      else role = UserRole.CLIENT;
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      fullName: createUserDto.fullName,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      email: createUserDto.email,
      contactNumber: createUserDto.contactNumber,
      password: hashedPassword,
      role,
      isActive: createUserDto.isActive !== undefined ? createUserDto.isActive : true,
    });

    const saved = await this.userRepository.save(user);
    const { password, ...result } = saved;
    return {
      userId: saved.id,
      id: saved.id,
      firstName: saved.firstName || saved.fullName.split(' ')[0],
      lastName: saved.lastName || saved.fullName.split(' ').slice(1).join(' '),
      fullName: saved.fullName,
      email: saved.email,
      contactNumber: saved.contactNumber,
      role: saved.role,
      dateRegistered: saved.createdAt ? saved.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      ...result,
    };
  }

  async findAll(role?: UserRole, isActive?: boolean): Promise<User[]> {
    const query = this.userRepository.createQueryBuilder('user')
      .select([
        'user.id',
        'user.fullName',
        'user.email',
        'user.role',
        'user.isActive',
        'user.createdAt',
        'user.updatedAt',
      ]);

    if (role) {
      query.andWhere('user.role = :role', { role });
    }
    if (isActive !== undefined) {
      query.andWhere('user.isActive = :isActive', { isActive });
    }

    return query.orderBy('user.id', 'ASC').getMany();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'fullName', 'email', 'contactNumber', 'role', 'isActive', 'createdAt', 'updatedAt'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    return user;
  }

  async findByEmail(email: string, includePassword = false): Promise<User | null> {
    const query = this.userRepository.createQueryBuilder('user')
      .where('user.email = :email', { email });

    if (includePassword) {
      query.addSelect('user.password');
    }

    return query.getOne();
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailTaken = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (emailTaken) {
        throw new ConflictException(`Email '${updateUserDto.email}' is already in use.`);
      }
      user.email = updateUserDto.email;
    }

    if (updateUserDto.fullName) {
      user.fullName = updateUserDto.fullName;
    }

    if (updateUserDto.contactNumber !== undefined) {
      user.contactNumber = updateUserDto.contactNumber;
    }

    if (updateUserDto.role) {
      user.role = updateUserDto.role;
    }

    if (updateUserDto.isActive !== undefined) {
      user.isActive = updateUserDto.isActive;
    }

    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    await this.userRepository.save(user);
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string; id: number; deactivated: boolean }> {
    const user = await this.findOne(id);

    // Prefer safe account deactivation to preserve historical relational integrity
    user.isActive = false;
    await this.userRepository.save(user);

    return {
      message: `User ID ${id} successfully deactivated.`,
      id,
      deactivated: true,
    };
  }
}
