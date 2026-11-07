import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateEntryDto } from '../dtos/create-entry.dto';
import { UpdateEntryDto } from '../dtos/update-entry.dto';
import { FreeTimeService } from '../services/free-time.service';
import { RoutineService } from '../services/routine.service';

// CONTROLLER (C): every route here needs a logged-in user (the guard),
// and always uses req.user.sub (the logged-in user's id), never an id sent by the browser.
@UseGuards(JwtAuthGuard)
@Controller('routine')
export class RoutineController {
  constructor(private readonly routine: RoutineService, private readonly freeTime: FreeTimeService) {}

  @Get('entries')
  async list(@Req() req: any) {
    return { semester: this.routine.semester, entries: await this.routine.list(req.user.sub) };
  }

  @Get('free-time')
  getFreeTime(@Req() req: any) {
    return this.freeTime.forUser(req.user.sub);
  }

  @Post('entries')
  create(@Req() req: any, @Body() dto: CreateEntryDto) {
    return this.routine.create(req.user.sub, dto);
  }

  @Patch('entries/:id')
  update(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEntryDto) {
    return this.routine.update(req.user.sub, id, dto);
  }

  @Delete('entries/:id')
  remove(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.routine.remove(req.user.sub, id);
  }
}