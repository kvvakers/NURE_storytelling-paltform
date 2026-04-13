import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../models/entities/postgres/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      email: createUserDto.email,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  async findOneByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findOneById(id: number) {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async getProfile(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const { password, ...profile } = user;
    return profile;
  }

  async updateProfile(id: number, dto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.username !== undefined) {
      const existing = await this.userRepository.findOne({
        where: { username: dto.username },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Username already taken');
      }
      user.username = dto.username;
    }
    if (dto.bio !== undefined) user.bio = dto.bio;
    if (dto.avatar !== undefined) user.avatar = dto.avatar;

    await this.userRepository.save(user);
    const { password, ...profile } = user;
    return profile;
  }
}
