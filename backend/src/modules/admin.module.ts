import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from '../controllers/admin.controller';
import { Report } from '../models/report.entity';
import { User } from '../models/user.entity';
import { AdminService } from '../services/admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Report])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}