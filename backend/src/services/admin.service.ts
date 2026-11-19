import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from '../models/report.entity';
import { User } from '../models/user.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Report)
    private readonly reportsRepo: Repository<Report>,
  ) {}

  // Gets all data needed for the Admin Dashboard in one call
  async getDashboardData() {
    const [pendingFaculty, reports, users] = await Promise.all([
      this.usersRepo.find({
        where: { role: 'faculty', isVerified: false },
        order: { createdAt: 'DESC' },
      }),
      this.reportsRepo.find({
        order: { createdAt: 'DESC' },
      }),
      this.usersRepo.find({
        order: { createdAt: 'DESC' },
      }),
    ]);

    return { pendingFaculty, reports, users };
  }

  // Approves a faculty account
  async verifyFaculty(userId: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== 'faculty') {
      throw new BadRequestException('Only faculty accounts can be verified');
    }
    user.isVerified = true;
    return this.usersRepo.save(user);
  }

  // Suspends or restores a user account
  async setUserStatus(
    userId: string,
    status: 'active' | 'suspended',
  ): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'admin') {
      throw new BadRequestException('Cannot suspend an admin account');
    }
    user.status = status;
    return this.usersRepo.save(user);
  }

  // Marks an open report as resolved
  async resolveReport(reportId: string): Promise<Report> {
    const report = await this.reportsRepo.findOne({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');
    report.status = 'resolved';
    return this.reportsRepo.save(report);
  }
}