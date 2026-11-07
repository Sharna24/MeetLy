import { Injectable } from '@nestjs/common';
import { DAYS, DAY_END_MIN, DAY_START_MIN, Day, MIN_FREE_MIN } from '../config/routine.config';
import { RoutineService } from './routine.service';

export interface FreeSlot {
  day: Day;
  startMin: number;
  endMin: number;
}

interface Busy {
  dayOfWeek: Day;
  startMin: number;
  endMin: number;
}

// The heart of Meetly: given the busy times, find the gaps.
// It is a plain function (no database), so it is easy to test.
export function computeFreeSlots(
  busy: Busy[],
  dayStart = DAY_START_MIN,
  dayEnd = DAY_END_MIN,
  minFree = MIN_FREE_MIN,
): FreeSlot[] {
  const slots: FreeSlot[] = [];

  for (const day of DAYS) {
    const today = busy.filter((b) => b.dayOfWeek === day).sort((a, b) => a.startMin - b.startMin);
    let cursor = dayStart; // "everything before this point is already accounted for"

    for (const b of today) {
      const gapEnd = Math.min(b.startMin, dayEnd);
      if (gapEnd - cursor >= minFree) slots.push({ day, startMin: cursor, endMin: gapEnd });
      cursor = Math.max(cursor, b.endMin); // max() handles classes that overlap each other
    }

    if (dayEnd - cursor >= minFree) slots.push({ day, startMin: cursor, endMin: dayEnd });
  }
  return slots;
}

@Injectable()
export class FreeTimeService {
  constructor(private readonly routine: RoutineService) {}

  async forUser(userId: string) {
    const entries = await this.routine.list(userId);
    return {
      semester: this.routine.semester,
      dayStartMin: DAY_START_MIN,
      dayEndMin: DAY_END_MIN,
      minFreeMinutes: MIN_FREE_MIN,
      slots: computeFreeSlots(entries),
    };
  }
}