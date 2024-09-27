import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Auth } from '../auth/entities/auth.entity';
import { CreateAuthDto } from '../auth/dto/create-auth.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto ,auth:CreateAuthDto): Promise<User> {
    const newUser = this.userRepository.create({
      name: createUserDto.name,
      profilePictureUrl: createUserDto.profilePictureUrl,
      auth: auth, 
    });
    const savedUser = await this.userRepository.save(newUser);

    return savedUser;
  }

  async findOne(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['calendars'] }); // Include calendars if needed

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }
}

