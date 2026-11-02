import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { User } from '../models/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  findById(id: string) {
    return this.users.findOneBy({ id });
  }

  findByEmail(email: string) {
    return this.users.findOneBy({ email });
  }

  create(data: Partial<User>) {
    return this.users.save(this.users.create(data));
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    await this.users.update(id, {
      department: dto.department,
      studentId: dto.studentId ?? null,
      bio: dto.bio ?? null,
      profileComplete: true,
    });
    return this.findById(id);
  }
}
