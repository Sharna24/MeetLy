import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoutineController } from '../controllers/routine.controller';
import { RoutineEntry } from '../models/routine-entry.entity';
import { FreeTimeService } from '../services/free-time.service';
import { RoutineService } from '../services/routine.service';

@Module({
  imports: [TypeOrmModule.forFeature([RoutineEntry])],
  controllers: [RoutineController],
  providers: [RoutineService, FreeTimeService],
  exports: [RoutineService, FreeTimeService], // other features (friends, who's free) will reuse these
})
export class RoutineModule {}