import {
  BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, UploadedFile, UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateEntryDto } from '../dtos/create-entry.dto';
import { ImportConfirmDto } from '../dtos/import-confirm.dto';
import { UpdateEntryDto } from '../dtos/update-entry.dto';
import { FreeTimeService } from '../services/free-time.service';
import { RoutineService } from '../services/routine.service';
import { ScheduleImportService } from '../services/schedule-import.service';

// CONTROLLER (C): every route here needs a logged-in user (the guard),
// and always uses req.user.sub (the logged-in user's id), never an id sent by the browser.
@UseGuards(JwtAuthGuard)
@Controller('routine')
export class RoutineController {
  constructor(
    private readonly routine: RoutineService,
    private readonly freeTime: FreeTimeService,
    private readonly importer: ScheduleImportService,
  ) {}

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

  // Step 1 of the import: upload a PDF or picture, get back what was found (nothing is saved).
  // The file is kept in memory only and thrown away after the reply. It is never stored.
  @Post('import/preview')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024, files: 1 } }))
  preview(@Req() req: any, @UploadedFile() file?: { buffer: Buffer }) {
    if (!file) throw new BadRequestException('Choose a file to upload (field name "file").');
    return this.importer.preview(req.user.sub, file.buffer);
  }

  // Step 2: the student checked the preview; save the classes (all or nothing).
  @Post('import/confirm')
  confirm(@Req() req: any, @Body() dto: ImportConfirmDto) {
    return this.routine.importMany(req.user.sub, dto);
  }
}
