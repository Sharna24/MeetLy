import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { formatMinutes, rangesOverlap } from '../common/time';
import { DAYS, DEFAULT_SEMESTER } from '../config/routine.config';
import { CreateEntryDto } from '../dtos/create-entry.dto';
import { UpdateEntryDto } from '../dtos/update-entry.dto';
import { RoutineEntry } from '../models/routine-entry.entity';

@Injectable()
export class RoutineService {
  constructor(
    @InjectRepository(RoutineEntry) private readonly entries: Repository<RoutineEntry>,
    private readonly config: ConfigService,
  ) {}

  get semester(): string {
    return (this.config.get<string>('CURRENT_SEMESTER') ?? DEFAULT_SEMESTER).toUpperCase();
  }

  // All of one user's entries for the current semester, in week order (Saturday first) then by time.
  async list(userId: string): Promise<RoutineEntry[]> {
    const rows = await this.entries.find({ where: { userId, semester: this.semester } });
    return rows.sort(
      (a, b) => DAYS.indexOf(a.dayOfWeek) - DAYS.indexOf(b.dayOfWeek) || a.startMin - b.startMin,
    );
  }

  // Add a class on one or more days. If any day clashes with an existing class, nothing is saved.
  async create(userId: string, dto: CreateEntryDto): Promise<RoutineEntry[]> {
    if (dto.endMin <= dto.startMin) {
      throw new BadRequestException('End time must be after start time');
    }
    const existing = await this.list(userId);

    for (const day of dto.days) {
      const clash = existing.find(
        (e) => e.dayOfWeek === day && rangesOverlap(e.startMin, e.endMin, dto.startMin, dto.endMin),
      );
      if (clash) throw this.clashError(dto.courseCode, day, clash);
    }

    const rows = dto.days.map((day) =>
      this.entries.create({
        userId,
        semester: this.semester,
        courseCode: dto.courseCode,
        section: dto.section || null,
        faculty: dto.faculty || null,
        room: dto.room || null,
        type: dto.type ?? 'class',
        dayOfWeek: day,
        startMin: dto.startMin,
        endMin: dto.endMin,
      }),
    );
    const saved = await this.entries.save(rows);
    return saved.sort((a, b) => DAYS.indexOf(a.dayOfWeek) - DAYS.indexOf(b.dayOfWeek));
  }

  async update(userId: string, id: string, dto: UpdateEntryDto): Promise<RoutineEntry> {
    const entry = await this.entries.findOneBy({ id, userId });
    if (!entry) throw new NotFoundException('Class not found');

    if (dto.courseCode !== undefined) entry.courseCode = dto.courseCode;
    if (dto.section !== undefined) entry.section = dto.section || null;
    if (dto.faculty !== undefined) entry.faculty = dto.faculty || null;
    if (dto.room !== undefined) entry.room = dto.room || null;
    if (dto.type !== undefined) entry.type = dto.type;
    if (dto.dayOfWeek !== undefined) entry.dayOfWeek = dto.dayOfWeek;
    if (dto.startMin !== undefined) entry.startMin = dto.startMin;
    if (dto.endMin !== undefined) entry.endMin = dto.endMin;

    if (entry.endMin <= entry.startMin) {
      throw new BadRequestException('End time must be after start time');
    }

    const others = (await this.list(userId)).filter((e) => e.id !== id);
    const clash = others.find(
      (e) => e.dayOfWeek === entry.dayOfWeek && rangesOverlap(e.startMin, e.endMin, entry.startMin, entry.endMin),
    );
    if (clash) throw this.clashError(entry.courseCode, entry.dayOfWeek, clash);

    return this.entries.save(entry);
  }

  async remove(userId: string, id: string): Promise<{ ok: true }> {
    // "userId" in the condition means you can only delete your own entries.
    const result = await this.entries.delete({ id, userId });
    if (!result.affected) throw new NotFoundException('Class not found');
    return { ok: true };
  }

  private clashError(code: string, day: string, other: RoutineEntry) {
    return new ConflictException(
      `${code} overlaps with ${other.courseCode} on ${day} (${formatMinutes(other.startMin)} - ${formatMinutes(other.endMin)})`,
    );
  }
}