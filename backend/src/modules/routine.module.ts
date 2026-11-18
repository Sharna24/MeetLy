import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoutineController } from '../controllers/routine.controller';
import { RoutineEntry } from '../models/routine-entry.entity';
import { FreeTimeService } from '../services/free-time.service';
import { RoutineService } from '../services/routine.service';
import { ScheduleImportService } from '../services/schedule-import.service';

@Module({
  imports: [TypeOrmModule.forFeature([RoutineEntry])],
  controllers: [RoutineController],
  providers: [RoutineService, FreeTimeService, ScheduleImportService],
  exports: [RoutineService, FreeTimeService], // other features (friends, who's free) will reuse these
})
export class RoutineModule {}
